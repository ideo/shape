class Ability
  include CanCan::Ability

  def initialize(user)

    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/wiki/Defining-Abilities

    user ||= User.new

    # Guests can read/manage nothing at the moment
    return unless user.persisted?

    if user.has_cached_role?(:super_admin)
      can :read, :all
      can :manage, :all

    else
      can :view, User
      can :manage, User, id: user.id

      can :create, Group
      can :read, Group do |group|
        # User is a member of any group in this org
        user.organization_ids.include?(group.organization_id)
      end

      can :manage, Group do |group|
        user.has_cached_role?(Role::ADMIN, group)
      end

      can :create, Collection
      can :read, Collection do |collection|
        collection.can_view?(user)
      end

      can :manage, Collection do |collection|
        collection.can_edit?(user)
      end

      can :create, CollectionCard
      can :read, CollectionCard do |collection_card|
        collection_card.parent.can_view?(user)
      end

      can :manage, CollectionCard do |collection_card|
        collection_card.parent.can_edit?(user)
      end

      can :create, Item
      can :read, Item do |item|
        item.can_view?(user)
      end

      can :manage, Item do |item|
        item.can_edit?(user)
      end
    end
  end
end
