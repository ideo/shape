module Breadcrumb
  class ForUser
    def initialize(breadcrumb, user)
      @breadcrumb = breadcrumb
      @user = user
    end

    def viewable
      @viewable ||= select_breadcrumb_items_cascading do |item|
        content_can_view?(item)
      end
    end

    def editable
      @editable ||= select_breadcrumb_items_cascading do |item|
        content_can_edit?(item)
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

    def content_can_view?(breadcrumb_item)
      content_can.view?(
        resource_identifier_for_breadcrumb_item(
          breadcrumb_item,
        ),
      )
    end

    def content_can_edit?(breadcrumb_item)
      content_can.edit?(
        resource_identifier_for_breadcrumb_item(
          breadcrumb_item,
        ),
      )
    end

    # API expects downcase, pluralized classname (e.g. 'collections')
    def breadcrumb_item_for_api(item)
      klass = item.shift.downcase.pluralize
      [klass] + item
    end

    def resource_identifier_for_breadcrumb_item(item)
      item.first(2).join('_')
    end

    def content_can
      @content_can ||= Permissions::UserCan.new(user)
    end
  end
end
