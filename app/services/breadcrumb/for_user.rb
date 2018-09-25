module Breadcrumb
  class ForUser
    VIEW_ROLE = Role::VIEWER
    EDIT_ROLE = Role::EDITOR

    def initialize(object, user)
      @object = object
      @user = user
    end

    def viewable
      @viewable ||= select_breadcrumb_items_cascading do |item|
        user_can?(VIEW_ROLE, item) ||
          user_can?(EDIT_ROLE, item)
      end
    end

    def editable
      @editable ||= select_breadcrumb_items_cascading do |item|
        user_can?(EDIT_ROLE, item)
      end
    end

    def viewable_collections
      ids = viewable
      collections = Collection
                    .where(id: ids)
                    .order("position(id::text in '#{ids.join(',')}')")
                    .select(:id, :name)
                    .to_a

      if @user.in_my_collection?(@object)
        collections = collections.unshift(@user.current_user_collection)
      end

      collections
    end

    # Transforms collection ids into breadcrumb with collection names
    def viewable_to_api
      (viewable_collections + [@object]).map do |object|
        breadcrumb_item_for_api(object)
      end
    end

    # Checks if user can view this breadcrumb item,
    # by checking if they have view rights on anything within the breadcrumb chain
    def can_view_item?(breadcrumb_item)
      viewable.include?(breadcrumb_item)
    end

    # Checks if user can edit this breadcrumb item,
    # by checking if they have edit rights on anything within the breadcrumb chain
    def can_edit_item?(breadcrumb_item)
      editable.include?(breadcrumb_item)
    end

    private

    # Iterates through breacrumb items and yields them to a block
    # The first item to yield true then triggers returning all subsequent items
    def select_breadcrumb_items_cascading
      can = false

      @object.breadcrumb.select do |breadcrumb_item|
        # If we haven't reached an item they can view,
        # check to see if they can see it
        if can
          true
        else
          can = yield(breadcrumb_item)
        end
      end
    end

    # API expects downcase, pluralized classname (e.g. 'collections')
    def breadcrumb_item_for_api(object)
      klass = object.class.base_class.name.downcase.pluralize
      [klass, object.id, object.name]
    end

    # we directly look up has_role_by_identifier for the breadcrumb, e.g. [5] becomes "Collection_5"
    def user_can?(role_name, breadcrumb_item)
      return true if @user.has_cached_role?(Role::SUPER_ADMIN)
      @user.has_role_by_identifier?(role_name, "Collection_#{breadcrumb_item}")
    end
  end
end
