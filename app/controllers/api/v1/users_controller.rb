class Api::V1::UsersController < Api::V1::BaseController
  load_and_authorize_resource

  def show
    render jsonapi: @user, include: %i[current_organization]
  end

  def me
    render jsonapi: current_user, include: %i[current_organization]
  end

  def search
    render jsonapi: search_users(params[:query])
  end

  private

  def search_users(query)
    return [] if query.blank?

    User.search(
      query.downcase,
      fields: ['name^2', { email: :exact }],
      match: :word_start,
      where: { organization_ids: current_organization.id },
    )
  end
end
