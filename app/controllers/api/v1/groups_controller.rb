class Api::V1::GroupsController < Api::V1::BaseController
  deserializable_resource :group, class: DeserializableGroup, only: %i[create update]
  load_and_authorize_resource :organization, only: %i[index]
  load_and_authorize_resource

  # All the groups in this org
  # /organizations/:id/groups
  def index
    render jsonapi: @organization.groups.order(name: :asc)
  end

  def show
    render jsonapi: @group, include: [roles: %i[users groups]]
  end

  def create
    @group.organization = current_organization
    if @group.save
      current_user.add_role(Role::ADMIN, @group)
      # TODO I think this was not wrapping res in "data"?
      render jsonapi: @group.reload, include: [roles: [:users]]
    else
      render_api_errors @group.errors
    end
  end

  def update
    @group.attributes = group_params
    if @group.save
      render jsonapi: @group
    else
      render_api_errors @group.errors
    end
  end

  def archive
    if @group.archive!
      archive_group_handle(@group)
      remove_group_roles(@group)
      remove_group_from_resources(@group.reload)
      render jsonapi: @group.reload
    else
      render_api_errors @group.errors
    end
  end

  private

  def group_params
    params.require(:group).permit(
      :name,
      :handle,
      filestack_file_attributes: Group.filestack_file_attributes_whitelist,
    )
  end

  def remove_group_roles(group)
    call_mass_remove(group, group.admins[:users].to_a, [], "admin")
    call_mass_remove(group, group.members[:users].to_a, [], "member")
  end

  def remove_group_from_resources(group)
    # TODO how to do less here rather then call on every resource
    # an additional complication here: When you archive the group, you
    # could be on the current page of the resource it will be removed from
    # so technically you'd want it to be a synchronous remove, so you can
    # refetch the resource roles after the request is done.
    group.roles_to_resources.each do |role|
      call_mass_remove(role.resource, [], [group], role.name)
    end
  end

  def call_mass_remove(object, all_users, all_groups, role_name)
    Roles::MassRemove.new(
      object: object,
      role_name: role_name,
      users: all_users.compact,
      groups: all_groups.compact,
      remove_from_children_sync: false,
    ).call
  end

  def archive_group_handle(group)
    group.update(handle: "archived-" + Time.now.to_f.to_s)
  end
end
