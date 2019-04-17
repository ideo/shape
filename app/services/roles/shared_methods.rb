module Roles
  module SharedMethods
    extend ActiveSupport::Concern

    def collections_to_link
      objects_to_link
        .select { |object| object.is_a?(Collection) }
        .map(&:id)
    end

    def items_to_link
      objects_to_link
        .select { |object| object.is_a?(Item) }
        .map(&:id)
    end

    def objects_to_link
      # TODO: use relation to query this?
      if @object.is_a?(Group)
        return [] if @object.primary?
        @object.current_shared_collection.link_collection_cards.map(&:record)
      else
        [@object]
      end
    end

    def group_ids
      # The primary group has special behavior: it does not gather + share content
      groups = @groups.reject(&:primary?)
      groups.map(&:id)
    end

    def shared_user_ids
      groups = @groups.reject(&:primary?)
      # @groups can be an array and not a relation, try to get user_ids via relation first
      unless (group_user_ids = groups.try(:user_ids))
        group_user_ids = Group.where(id: groups.pluck(:id)).user_ids
      end
      (group_user_ids + @users.map(&:id)).uniq
    end

    def unanchor_object
      # note this will always return nil for Groups
      return if @object.roles_anchor_collection_id.nil?
      # store this for later querying
      @previous_anchor_id = @object.roles_anchor_collection_id
      @object.unanchor_and_inherit_roles_from_anchor!
    end
  end
end
