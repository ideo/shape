module Api
  class OrganizationAbility
    include CanCan::Ability

    def initialize(organization)
      organization ||= Organization.new

      # modify represents all the non-read-only actions
      alias_action :create, :update, :destroy, to: :modify

      if organization.persisted? && organization.active?
        can :read, Organization, id: organization.id

        can :read, User do |user|
          user.organization_ids.include?(organization.id)
        end

        can :read, Group, organization_id: organization.id

        can :create, Collection
        can :read, Collection, organization_id: organization.id
        can :manage, Collection, organization_id: organization.id

        can :create, CollectionCard
        can :manage, CollectionCard do |coll_card|
          coll_card.parent.try(:organization_id) == organization.id
        end

        can :create, Item
        can :manage, Item do |item|
          item.parent.try(:organization_id) == organization.id
        end
      else
        cannot :modify, :all
        cannot :read, :all
      end
    end
  end
end
