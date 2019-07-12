class Callbacks::IdeoNetworkController < ApplicationController
  before_action :authenticate_request

  def invoices
    event = params[:event]
    if event == 'invoice.payment_failed'
      process_invoice_payment_failed_event
    else
      logger.debug("Unsupported invoice event: #{event}")
      head :bad_request
      return
    end
  end

  def payment_methods
    event = params[:event]
    if event == 'payment_method.created'
      process_payment_method_created
    elsif event == 'payment_method.expiring'
      process_payment_method_expiring
    else
      logger.debug("Unsupported payment event: #{event}")
      head :bad_request
      return
    end
  end

  def users
    if user.present?
      if event == :updated
        process_user_updated
      elsif event == :deleted
        process_user_deleted
      else
        logger.debug("Unsupported users event: #{event}")
        head :bad_request
        return
      end
    end

    head :ok
  end

  def users_roles
    role = find_included('roles')[:attributes]
    return unless role[:resource_type] == 'Group'
    group = Group.find_by(network_id: role[:resource_id])
    user = User.find_by(uid: users_role_params[:user_uid])

    case event.to_s
    when 'users_role.added'
      process_group_role_added(role: role, group: group, user: user)
    when 'users_role.removed'
      process_group_role_removed(role: role, group: group, user: user)
    else
      logger.debug("Unsupported user roles event: #{event}")
      head :bad_request
      return
    end

    head :ok
  end

  def groups
    case event.to_s
    when 'group.created'
      process_group_created
    when 'group.deleted'
      process_group_deleted
    when 'group.updated'
      process_group_updated
    else
      logger.debug("Unsupported group event: #{event}")
      head :bad_request
      return
    end

    head :ok
  end

  private

  def process_user_updated
    user.update_from_network_profile(user_params)
  end

  def process_user_deleted
    user.archive!
  end

  def process_group_created
    organization = find_included('organizations').try(:[], :attributes)
    return if organization.blank?
    return if Group.find_by(network_id: group_params[:id]).present?
    Group.create(name: group_params[:name],
                 organization_id: organization[:external_id],
                 network_id: group_params[:id])
  end

  def process_group_deleted
    group.archive!
  end

  def process_group_updated
    group.update_from_network_profile(group_params)
  end

  def process_group_role_added(role:, group:, user:)
    Roles::MassAssign.call(
      object: group,
      role_name: role[:name],
      users: [user],
    )
  end

  def process_group_role_removed(role:, group:, user:)
    Roles::MassRemove.call(
      object: group,
      role_name: role[:name],
      users: [user],
    )
  end

  def process_invoice_payment_failed_event
    application_organization = find_included('application_organization')
    payment_method = find_included('payment_method')
    return head :bad_request unless application_organization && payment_method

    organization_id = application_organization.dig('attributes', 'external_id')
    begin
      organization = Organization.find(organization_id)
      InvoicePaymentFailedMailer.notify(organization.id, payment_method['id']).deliver_later
    rescue ActiveRecord::RecordNotFound
      return head :not_found
    end
    head :ok
  end

  def process_payment_method_created
    application_organization = find_included('application_organization')
    return head :bad_request unless application_organization

    organization_id = application_organization.dig('attributes', 'external_id')
    begin
      organization = Organization.find(organization_id)
      organization.update_payment_status
      return head :ok
    rescue ActiveRecord::RecordNotFound
      return head :not_found
    end
  end

  def process_payment_method_expiring
    payment_method_id = params.dig('data', 'attributes', 'id')
    application_organization = find_included('application_organization')
    return head :bad_request unless payment_method_id && application_organization

    organization_id = application_organization.dig('attributes', 'external_id')
    begin
      organization = Organization.find(organization_id)
      PaymentMethodExpiringMailer.notify(organization.id, payment_method_id).deliver_later
    rescue ActiveRecord::RecordNotFound
      return head :not_found
    end
    head :ok
  end

  def event
    params[:event].to_sym
  end

  def user
    @user ||= User.find_by_uid(user_params[:uid])
  end

  def users_role
    @users_role ||= UsersRole.find(users_role_params[:id])
  end

  def group
    @group ||= Group.find_by(network_id: group_params[:id])
  end

  def user_params
    params.require(:data).require(:attributes).permit(
      :uid,
      :provider,
      :first_name,
      :last_name,
      :email,
      :picture,
      :username,
    )
  end

  def users_role_params
    params.require(:data).require(:attributes).permit(
      :id,
      :name,
      :user_id,
      :user_uid,
    )
  end

  def group_params
    params.require(:data).require(:attributes).permit(
      :id,
      :uid,
      :name,
      :organization_id,
      :external_id,
      :created_at,
      :updated_at,
      :member_ids,
      :admin_ids,
    )
  end

  def authenticate_request
    return true if request.headers['HTTP_AUTHORIZATION'] == ENV['IDEO_SSO_CLIENT_SECRET']

    head :unauthorized
  end

  def find_included(type)
    params.fetch('included', []).find do |resource|
      resource['type'] == type.pluralize
    end
  end
end
