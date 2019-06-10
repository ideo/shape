class MailingListSubscription < SimpleService
  # this is the IDEO Products mailchimp mailing list
  MAILCHIMP_LIST_ID = 'b141f584d3'.freeze

  delegate :organizations, to: :@user

  def initialize(user:, subscribe:)
    @user = user
    @subscribe = subscribe
  end

  def call
    return if network_mailing_list.blank? || network_organization_ids.blank?
    if @subscribe
      subscribe
    else
      unsubscribe
    end
  end

  private

  def network_organization_ids
    organizations.map { |org| org.network_organization&.id }.compact
  end

  def network_mailing_list
    @network_mailing_list ||= NetworkApi::MailingList.where(
      mailchimp_list_id: MAILCHIMP_LIST_ID,
    ).first
  end

  def subscribe
    NetworkApi::MailingListMembership.create(
      mailing_list_id: network_mailing_list.id,
      organization_ids: network_organization_ids,
      user_uid: @user.uid,
    )
  end

  def unsubscribe
    membership = NetworkApi::MailingListMembership.where(
      mailing_list_id: network_mailing_list.id,
      user_uid: @user.uid,
    ).first
    membership.destroy if membership.present?
  end
end
