module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user || reject_unauthorized_connection
    end

    def current_ability
      @current_ability ||= Ability.new(current_user)
    end

    private

    def find_verified_user
      app_cookies_key = Rails.application.config.session_options[:key] ||
                        raise('Anycable: no session cookies key in config')

      env['rack.session'] = cookies.encrypted[app_cookies_key]
      Warden::SessionSerializer.new(env).fetch(:user)
    end
  end
end
