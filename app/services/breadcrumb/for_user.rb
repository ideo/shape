module Breadcrumb
  class ForUser
    VIEW_ROLE = Role::VIEWER
    CONTENT_EDIT_ROLE = Role::CONTENT_EDITOR
    EDIT_ROLE = Role::EDITOR

    def initialize(breadcrumb, user)
      @breadcrumb = breadcrumb
      @user = user
    end

    def viewable
      @viewable ||= select_breadcrumb_items_cascading do |item|
        user_can?(VIEW_ROLE, item) ||
          user_can?(CONTENT_EDIT_ROLE, item) ||
          user_can?(EDIT_ROLE, item)
      end
    end

    def editable
      @editable ||= select_breadcrumb_items_cascading do |item|
        user_can?(CONTENT_EDIT_ROLE, item)
      end
    end

    # Transforms object class names to the types JSON API expects
    def viewable_to_api
      viewable.map do |item|
        breadcrumb_item_for_api(item)
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

    attr_reader :breadcrumb, :user

    # Iterates through breacrumb items and yields them to a block
    # The first item to yield true then triggers returning all subsequent items
    def select_breadcrumb_items_cascading
      can = false

      breadcrumb.select do |breadcrumb_item|
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
    def breadcrumb_item_for_api(item)
      klass = item.shift.downcase.pluralize
      [klass] + item
    end

    def resource_identifier_for_breadcrumb_item(item)
      item.first(2).join('_')
    end

    # we directly look up has_role_by_identifier for the breadcrumb, e.g. ["Collection", 4, "Name"]
    def user_can?(role_name, breadcrumb_item)
      resource_identifier = resource_identifier_for_breadcrumb_item(breadcrumb_item)
      user.has_role_by_identifier?(role_name, resource_identifier)
    end
  end
end
