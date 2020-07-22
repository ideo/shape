class GenerateSimpleWebRtcToken < SimpleService
  def initialize(user)
    @user = user
  end

  def call
    JWT.encode(data, ENV['SIMPLE_WEB_RTC_API_SECRET'], 'HS256')
  end

  private

  def data
    {
      id: @user.id,
      name: @user.name,
    }
  end
end
