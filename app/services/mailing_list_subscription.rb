class MailingListSubscription < SimpleService
  # this is for marking the Shape mailchimp "interest" value
  SHAPE_INTEREST_ID = '9a0c2fe37c'.freeze

  delegate :organizations, to: :@user

  def self.lists
    {
      # IDEO Products mailchimp mailing list (opt-in subscription)
      products_mailing_list: 'b141f584d3',
      # Shape Users mailing list (all users are automatically subscribed)
      shape_users: '1e849dbdc8',
      # Beta test list
      shape_circle: '7b06778156',
    }
  end

  def initialize(user:, list:, subscribe:)
    @user = user
    @list = list.to_sym
    @subscribe = subscribe
  end

  def call
    return false if network_mailing_list.blank?
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
      mailchimp_list_id: mailchimp_list_id,
    ).first
  end

  def mailchimp_list_id
    self.class.lists[@list]
  end

  def subscription_params
    params = {
      mailing_list_id: network_mailing_list.id,
      user_uid: @user.uid,
    }

    case @list
    when :products_mailing_list
      params.merge(
        interest_ids: [SHAPE_INTEREST_ID],
      )
    when :shape_users
      params.merge(
        organization_ids: network_organization_ids,
      )
    else
      params
    end
  end

  def subscribe
    NetworkApi::MailingListMembership.create(subscription_params)
  end

  def unsubscribe
    membership = NetworkApi::MailingListMembership.where(
      mailing_list_id: network_mailing_list.id,
      user_uid: @user.uid,
    ).first
    membership.destroy if membership.present?
  end
end
