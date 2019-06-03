class MailingListSubscription < SimpleService
  # this is the IDEO Products mailchimp mailing list
  MAILCHIMP_LIST_ID = 'b141f584d3'.freeze
  # this is for marking the Shape mailchimp "interest" value
  SHAPE_ID = '9a0c2fe37c'.freeze

  delegate :current_organization, to: :@user

  def initialize(user:, subscribe:)
    @user = user
    @subscribe = subscribe
  end

  def call
    return if network_mailing_list.blank? || current_network_organization.blank?
    if @subscribe
      subscribe
    else
      unsubscribe
    end
  end

  private

  def current_network_organization
    current_organization&.network_organization
  end

  def network_mailing_list
    @network_mailing_list ||= NetworkApi::MailingList.where(
      mailchimp_list_id: MAILCHIMP_LIST_ID,
    ).first
  end

  def subscribe
    NetworkApi::MailingListMembership.create(
      mailing_list_id: network_mailing_list.id,
      organization_id: current_network_organization.id,
      user_uid: @user.uid,
    )
  end

  def unsubscribe
    membership = NetworkApi::MailingListMembership.where(
      mailing_list_id: network_mailing_list.id,
      organization_id: current_network_organization.id,
      user_uid: @user.uid,
    )
    membership.destroy if membership.present?
  end
end
