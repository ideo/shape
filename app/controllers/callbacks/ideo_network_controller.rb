class Callbacks::IdeoNetworkController < ApplicationController
  before_action :authenticate_request

  def payment_methods
    application_organization_id = params.dig(
      'data',
      'relationships',
      'application_organizations',
      'relationships',
      'application_organization',
      'data',
      'id',
    )
    application_organization = params.fetch('included', []).find do |x|
      x['id'] == application_organization_id && x['type'] == 'application_organizations'
    end
    return head :bad_request unless application_organization

    organization_id = application_organization.dig('attributes', 'external_id')
    return head :bad_request unless organization_id

    organization = Organization.find(organization_id)
    organization.update_payment_status
    head :ok
  rescue ActiveRecord::RecordNotFound
    head :not_found
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

  private

  def process_user_updated
    user.update_from_network_profile(user_params)
  end

  def process_user_deleted
    user.destroy
  end

  def event
    params[:event].to_sym
  end

  def user
    @user ||= User.find_by_uid(user_params[:uid])
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

  def authenticate_request
    return true if request.headers['HTTP_AUTHORIZATION'] == ENV['IDEO_SSO_CLIENT_SECRET']

    head :unauthorized
  end
end
