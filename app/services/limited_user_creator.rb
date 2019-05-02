class LimitedUserCreator < SimpleService
  attr_accessor :limited_user

  def initialize(contact_info:)
    @contact_info = contact_info
    @email = nil
    @phone_number = nil
    @limited_user = nil

    @errors = []
  end

  def call
    return false unless validate_contact_info
    network_user = create_network_user
    user = create_user(network_user)
    user
  end

  private

  def validate_contact_info
    if contact_info_email?
      @email = @contact_info
    else
      @phone_number = normalize_phone_number
    end
  end

  def contact_info_email?
    @contact_info.match(URI::MailTo::EMAIL_REGEXP).present?
  end

  def normalize_phone_number
    Phony.normalize(@contact_info)
  rescue Phony::NormalizationError
    @errors.push('Contact information invalid')
    false
  end

  def create_network_user
    if @email
      NetworkApi::User.create(
        email: @email,
        limited_user: true,
      )
    else
      NetworkApi::User.create(
        phone: @phone_number,
        limited_user: true,
      )
    end
  end

  def create_user(network_user)
    network_user.status = :limited
    network_user.save
  end
end
