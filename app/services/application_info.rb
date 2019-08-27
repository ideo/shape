class ApplicationInfo < SimpleService
  def initialize(application)
    @application = application
  end

  def name
    return @application.name if default?
    'Shape'
  end

  def invite_url(invited_to = nil)
    return @application.invite_url if default?
    invited_to_url = frontend_url_for(invited_to)
  end

  def invite_cta(invited_to_type = nil)
    default? ? "Join #{invited_to_type}" : 'View your results'
  end

  def email
    return @application.email if default?
    'Shape <hello@shape.space>'
  end

  def logo_url
    return @application.logo_url if default?
    'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_2x.png'
  end

  private

  def default?
    !@application.present?
  end
end
