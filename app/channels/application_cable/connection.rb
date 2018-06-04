module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    def current_ability
      @current_ability ||= Ability.new(current_user)
    end

    private

    def find_verified_user
      return env['warden'].user if env['warden'].user.present?
      reject_unauthorized_connection
    end
  end
end
