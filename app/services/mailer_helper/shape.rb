module MailerHelper
  class Shape < Base
    def name
      'Shape'
    end

    def email
      'hello@shape.space'
    end

    def invite_subject
      "Your invitation to \"#{invited_to_name}\" on Shape"
    end

    def invite_message
      msg = "#{invited_by.name} has invited you to join"
      msg += " #{org_name.possessive}" if org_name.present?
      msg += " \"#{invited_to_name}\""
      msg += ' group' if org_name.present?
      msg + ' on Shape.'
    end

    def invite_url
      router.frontend_url_for(invited_to)
    end

    def invite_cta
      "Join #{invited_to_type}"
    end

    def logo_url
      'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo_2x.png'
    end

    def branding_byline
      'Shape'
    end

    def default?
      true
    end
  end
end
