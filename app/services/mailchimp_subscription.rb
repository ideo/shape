class MailchimpSubscription < SimpleService
  # this is the IDEO Products mailchimp mailing list
  LIST_ID = 'b141f584d3'.freeze
  # this is for marking the Shape mailchimp "interest" value
  SHAPE_ID = '9a0c2fe37c'.freeze

  def initialize(user:, subscribe:)
    @user = user
    @subscribe = subscribe
  end

  def call
    return unless ENV['MAILCHIMP_API_KEY'].present?
    @subscribe ? subscribe : unsubscribe
  end

  private

  def gibbon
    # no need to memoize, these request objects are meant to be one-time use
    Gibbon::Request.new(api_key: ENV['MAILCHIMP_API_KEY'])
  end

  def subscribe
    gibbon
      .lists(LIST_ID)
      .members(lower_case_md5_hashed_email_address)
      .upsert(body: {
                email_address: @user.email,
                status: 'subscribed',
                merge_fields: { FNAME: @user.first_name, LNAME: @user.last_name },
                interests: { SHAPE_ID => true },
              })
  end

  def lower_case_md5_hashed_email_address
    # mailchimp's method of identifying user by email
    Digest::MD5.hexdigest(@user.email.downcase)
  end

  def unsubscribe
    gibbon
      .lists(LIST_ID)
      .members(lower_case_md5_hashed_email_address)
      .update(body: { status: 'unsubscribed' })
  end
end
