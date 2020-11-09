class Api::V1::CollectionCardsController < Api::V1::BaseController
  deserializable_resource :section, class: DeserializableSection, only: %i[
    create
    update
  ]
  load_resource :section

  def show
    render jsonapi: @section, include: [
      :parent,
    ]
  end

  def create
    section = section.new(section_params)
    if section.create
      render jsonapi: section
    else
      render_api_errors section.errors
    end
  end

  def destroy
    if @section.destroy
      head :no_content
    else
      render_api_errors @section.errors
    end
  end

  def update
    @section.attributes = section_params

    if @section.save
      render jsonapi: @section
    else
      render_api_errors @section.errors
    end
  end

  def section_params
    params.require(:section).permit(
      [
        :name,
        :row,
        :col,
        :width,
        :height,
      ],
    )
  end
end
