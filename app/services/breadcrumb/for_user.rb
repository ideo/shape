module Breadcrumb
  class ForUser
    def initialize(raw_breadcrumb, user)
      @raw_breadcrumb = raw_breadcrumb
      @user = user
      @breadcrumb = []
    end

    def call
      select_items_user_can_see
      breadcrumb
    end

    def to_api
      call
      breadcrumb.map do |item|
        breadcrumb_item_for_api(item)
      end
    end

    private

    attr_reader :breadcrumb, :raw_breadcrumb, :user

    def select_items_user_can_see
      can_view = false

      @breadcrumb = raw_breadcrumb.select do |breadcrumb_item|
        # If we haven't reached an item they can view,
        # check to see if they can see it
        if can_view
          true
        else
          can_view = can_view?(breadcrumb_item)
        end
      end
    end

    def can_view?(breadcrumb_item)
      content_can.view?(
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
      @content_can ||= Roles::UserCan.new(user)
    end
  end
end
