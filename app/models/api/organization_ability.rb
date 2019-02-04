module Api
  class OrganizationAbility
    include CanCan::Ability

    def initialize(organization)
      organization ||= Organization.new

      # modify represents all the non-read-only actions
      alias_action :create, :update, :destroy, to: :modify

      cannot :modify, :all

      if organization.persisted? && organization.active?
        # Allow read-only access to all content
        # this organization has access to

        can :read, Organization, id: organization.id

        can :read, User do |user|
          user.organization_ids.include?(organization.id)
        end

        can :read, Group, organization_id: organization.id

        can :read, Collection, organization_id: organization.id

        can :read, CollectionCard do |coll_card|
          coll_card.parent.try(:organization_id) == organization.id
        end

        can :read, Item do |item|
          item.parent.try(:organization_id) == organization.id
        end
      else
        cannot :read, :all
      end
    end
  end
end
