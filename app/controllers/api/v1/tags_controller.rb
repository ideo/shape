class Api::V1::TagsController < Api::V1::BaseController
  deserializable_resource :tag, class: DeserializableTag, only: %i[create update]
  load_and_authorize_resource class: 'ActsAsTaggableOn::Tag', except: :index

  before_action :load_tags, only: %i[index]
  before_action :load_and_filter_index, only: %i[index]
  def index
    render jsonapi: @tags
  end

  def show
    render jsonapi: @tag
  end

  def create
    if @tag.organization_ids.blank?
      @tag.organization_ids = [current_organization.id] if current_organization.present?
    else
      @tag.organization_ids = @tag.organization_ids.map(&:to_i)
    end
    if @tag.save
      render jsonapi: @tag
    else
      render_api_errors @tag.errors
    end
  end

  def update
    @tag.attributes = tag_update_params
    @tag.organization_ids = @tag.organization_ids.map(&:to_i)
    if @tag.save
      render jsonapi: @tag
    else
      render_api_errors @tag.errors
    end
  end

  private

  def tag_params
    params.require(:tag).permit(
      :name,
      :color,
      organization_ids: [],
    )
  end

  def tag_update_params
    params.require(:tag).permit(
      :color,
      organization_ids: [],
    )
  end

  def load_tags
    @tags = ActsAsTaggableOn::Tag.order(name: :asc).limit(100)
  end
end
