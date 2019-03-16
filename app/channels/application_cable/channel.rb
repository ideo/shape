module ApplicationCable
  class Channel < ActionCable::Channel::Base
    delegate :current_ability, to: :connection
    protected :current_ability
  end
end
