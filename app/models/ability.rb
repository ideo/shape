class Ability
  include CanCan::Ability

  def initialize(user)

    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/wiki/Defining-Abilities

    user ||= User.new

    can :read, Organization
    can :read, User

    # Logged-in users only
    if user.persisted?

      # Anyone can create a new object
      # (controllers will authorize manage abilities on parent object)
      can :create, Collection
      can :create, CollectionCard
      can :create, Item

      can :read, Group do |group|
        group.can_view?(user)
      end

      can :manage, Group do |group|
        group.can_manage?(user)
      end

      can :manage, Organization do |organization|
        organization.can_manage?(user)
      end

      can :read, Collection do |collection|
        collection.can_view?(user)
      end

      can :manage, Collection do |collection|
        collection.can_edit?(user)
      end

      cannot :manage, Collection do |collection|
        collection.is_a?(Collection::SharedWithMeCollection)
      end

      can :read, CollectionCard do |collection_card|
        collection_card.can_view?(user)
      end

      can :manage, CollectionCard do |collection_card|
        collection_card.can_edit?(user)
      end

      can :read, Item do |item|
        item.can_view?(user)
      end

      can :manage, Item do |item|
        item.can_edit?(user)
      end
    end
  end
end
