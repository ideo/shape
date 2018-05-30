class Ability
  include CanCan::Ability

  def initialize(user)
    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/wiki/Defining-Abilities

    user ||= User.new
    # modify represents all the non-read-only actions
    alias_action :create, :update, :destroy, to: :modify

    # NOTE: `super_admin` role is not something that exists yet
    if user.has_cached_role?(:super_admin)
      can :read, :all
      can :manage, :all

    elsif user.persisted? && user.active?
      # Logged-in users only

      can :read, Organization do |organization|
        organization.can_view?(user)
      end
      can :read, User

      can :create, Group
      can :read, Group do |group|
        group.can_view?(user)
      end

      can :manage, Group do |group|
        group.can_edit?(user)
      end

      can :manage, Organization do |organization|
        organization.can_edit?(user)
      end

      can :create, Collection
      can %i[read duplicate], Collection do |collection|
        collection.can_view?(user)
      end
      can :manage, Collection do |collection|
        collection.can_edit?(user)
      end

      can :create, CollectionCard
      can %i[read duplicate], CollectionCard do |collection_card|
        collection_card.can_view?(user)
      end
      can :manage, CollectionCard do |collection_card|
        collection_card.can_edit?(user)
      end

      can :create, Item
      can %i[read duplicate], Item do |item|
        item.can_view?(user)
      end
      can :manage, Item do |item|
        item.can_edit?(user)
      end

      can :create, CommentThread
      can %i[read manage], CommentThread do |comment_thread|
        # equivalent to comment_thread.record.can_view?
        comment_thread.can_edit?(user)
      end
    end

    # don't allow any of the editing actions unless you've accepted terms
    # (i.e. user becomes view-only)
    cannot :modify, :all unless user.terms_accepted?
  end
end
