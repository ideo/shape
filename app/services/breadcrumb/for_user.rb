module Breadcrumb
  class ForUser
    VIEW_ROLE = Role::VIEWER
    EDIT_ROLE = Role::EDITOR

    def initialize(object, user, add_user_fields: false)
      @object = object
      @user = user || User.new
      @add_user_fields = add_user_fields
    end

    def viewable
      @viewable ||= select_breadcrumb_items_cascading do |item|
        user_can?(:view, item)
      end
    end

    def editable
      @editable ||= select_breadcrumb_items_cascading do |item|
        user_can?(:edit, item)
      end
    end

    def viewable_collections
      ids = viewable
      Collection
        .where(id: ids)
        .merge(
          # only show collections in your org
          Collection.where(organization_id: @user.current_organization_id)
          .or(
            # OR outside of your org where common_viewable == true
            Collection.where("cached_attributes->'common_viewable' = 'true'"),
          ),
        )
        .order(Arel.sql("position(collections.id::text in '#{ids.join(',')}')"))
        .select(:id, :name)
    end

    # Transforms collection ids into breadcrumb with collection names
    def viewable_to_api
      unless @user.persisted?
        return [breadcrumb_item_for_api(@object)]
      end

      (viewable_collections + [@object]).map do |object|
        breadcrumb_item_for_api(object)
      end
    end

    private

    # Iterates backwards through breadcrumb items and yields them to a block
    # The first item to yield false will block all subsequent items
    def select_breadcrumb_items_cascading
      can = true

      @object.breadcrumb.reverse.select do |breadcrumb_item|
        # If we haven't reached an item they can view,
        # check to see if they can see it
        if can
          can = yield(breadcrumb_item)
        else
          false
        end
      end.reverse
    end

    # API expects downcase, pluralized classname (e.g. 'collections')
    def breadcrumb_item_for_api(object)
      breadcrumb_item = {
        type: object.class.base_class.name.downcase.pluralize,
        collection_type: object.class.name,
        id: object.id.to_s,
        name: object.name,
        has_children: object.has_child_collections?,
      }
      unless @add_user_fields
        return breadcrumb_item
      end

      breadcrumb_item.merge(
        can_edit: object == @object ? object.can_edit?(@user) : editable.include?(object.id),
      )
    end

    def breadcrumb_collections
      @breadcrumb_collections ||= Collection.where(id: @object.breadcrumb)
    end

    # we directly look up has_role_by_identifier for the breadcrumb, e.g. [5] becomes "Collection_5"
    def user_can?(action, breadcrumb_item)
      return true if @user.has_cached_role?(Role::SUPER_ADMIN)

      collection = breadcrumb_collections.select { |c| c.id == breadcrumb_item }.first
      return false unless collection.present?

      collection.send("can_#{action}?", @user)
    end
  end
end
