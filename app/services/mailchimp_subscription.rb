class MailchimpSubscription < SimpleService
  LIST_ID = 'b141f584d3'.freeze
  SHAPE_ID = '9a0c2fe37c'.freeze

  def initialize(user:)
    @user = user
  end

  def call
    # based on `mailing_list` value this will either subscribe/unsubscribe them
    @user.mailing_list ? subscribe : unsubscribe
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
