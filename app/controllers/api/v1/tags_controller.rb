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
    @tag.organization_ids = [current_organization.id] if current_organization.present?
    @tag.application = current_application
    if @tag.save
      render jsonapi: @tag
    else
      render_api_errors @tag.errors
    end
  end

  def update
    @tag.attributes = tag_params
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
    )
  end

  def load_tags
    if current_api_token.present?
      @tags = ActsAsTaggableOn::Tag.where(application_id: current_application.id)
                                   .order(name: :asc)
    elsif current_organization.present?
      @tags = ActsAsTaggableOn::Tag.where('organization_ids @> ?', [current_organization.id].to_json)
                                   .order(name: :asc)
    else
      @tags = ActsAsTaggableOn::Tag.none
    end
  end
end
