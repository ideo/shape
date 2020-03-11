module ApplicationCable
  class Channel < ActionCable::Channel::Base
    after_subscribe :track_user
    after_unsubscribe :untrack_user
    delegate :current_ability, to: :connection
    protected :current_ability

    def track_user
      ChannelPresenceTracker.track(self.class.name, current_user.id)
    end

    def untrack_user
      ChannelPresenceTracker.untrack(self.class.name, current_user.id)
   end
  end
end
