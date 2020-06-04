module UserSpecificFields
  extend ActiveSupport::Concern

  included do
    has_many :roles do
      data do
        @object.anchored_roles(viewing_organization_id: @current_user&.current_organization_id)
      end
    end

    attribute :breadcrumb, if: -> { @current_user && @object == @current_record } do
      Breadcrumb::ForUser.new(
        @object,
        @current_user,
        add_user_fields: true,
      ).viewable_to_api
    end

    attribute :common_viewable, if: -> { @object == @current_record && @current_user } do
      # only `true` if you're viewing the common resource outside of its home org
      @object.common_viewable? && @object.organization_id != @current_user.current_organization_id
    end

    attribute :can_view, if: -> { @current_ability } do
      @current_ability.can?(:read, @object)
    end

    attribute :can_edit, if: -> { @current_ability } do
      @current_ability.can?(:edit, @object)
    end

    attribute :can_edit_content, if: -> { @current_ability } do
      # NOTE: this also ends up coming into play when you are an editor
      # but the collection is "pinned_and_locked"
      # -- also, if the collection is archived you can't edit content e.g. add/move cards
      @object.active? && @current_ability.can?(:edit_content, @object)
    end

    attribute :in_my_collection, if: -> { @current_user && @object == @current_record } do
      @current_user.in_my_collection?(@object)
    end

    attribute :cache_key, if: -> { @object == @current_record && @object.is_a?(Collection) } do
      Digest::MD5.hexdigest(@object.cache_key(@card_order || 'order', @current_user&.id))
    end
  end
end
