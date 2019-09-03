class LimitedUserCreator < SimpleService
  attr_accessor :limited_user, :errors, :created

  def initialize(contact_info:, user_info: {}, date_of_participation: nil)
    @contact_info = contact_info
    @user_info = user_info
    @date_of_participation = date_of_participation
    @email = nil
    @phone = nil
    @limited_user = nil
    @network_user = nil
    @created = false

    @errors = []
  end

  def call
    return false unless validate_contact_info

    find_or_create_network_user
    return false unless @network_user.present?

    if @network_user.errors.present?
      @errors = @network_user.errors
      return false
    end
    saved = create_user(@network_user)
    @errors = @limited_user.errors
    saved
  end

  private

  def validate_contact_info
    if contact_info_email?
      @email = @contact_info
    else
      @phone = normalize_phone_number
    end
  end

  def contact_info_email?
    @contact_info.match(URI::MailTo::EMAIL_REGEXP).present?
  end

  def normalize_phone_number
    phone = @contact_info.gsub(/[^0-9]/, '')
    # TODO: would be nice to use Phony here but it does not work well without
    # specifying the country code or using E164 Format
    # https://github.com/floere/phony/issues/8
    # return phone if Phony.plausible?(phone)
    return phone if phone.length >= 9 && phone.length <= 14

    @errors << 'Contact information invalid'
    false
  end

  def find_or_create_network_user
    params = {}
    params[:email] = @email if @email
    params[:phone] = @phone if @phone

    return false if params.empty?

    if ENV['IDEO_SSO_ENV'] == 'production' && !Rails.env.production? && ENV['SHAPE_APP'] != 'production'
      # if using prod SSO environment but not on shape-production,
      # just look up the same test user to not push fake users to ideo-sso
      params[:email] = 'test.user@shape.space'
      params.delete :phone
    end

    @network_user = NetworkApi::User.where(params).first
    # after finding based on email/phone, merge any additional info
    params.merge!(@user_info)
    if @network_user.present?
      # perform an update
      @network_user.attributes = params
      @network_user.save
      return
    end

    params[:limited_user] = true
    @network_user = NetworkApi::User.create(params)
    @created = true unless @network_user.errors.present?
  end

  def create_user(network_user)
    @limited_user = User.find_or_initialize_from_network(network_user)
    @limited_user.created_at = @date_of_participation if @date_of_participation.present?
    saved = @limited_user.save

    # this is just for the CSV import
    if @limited_user.persisted? && @date_of_participation.present?
      create_test_audience_invitation(@limited_user)
    end

    saved
  end

  def create_test_audience_invitation(user)
    return unless @date_of_participation.present?

    # this is a unique case where there was no test_audience but we want to record
    # when we last contacted them
    ta = TestAudienceInvitation.find_or_create_by(user: user, test_audience: nil)
    ta.update(created_at: @date_of_participation)
  end
end
