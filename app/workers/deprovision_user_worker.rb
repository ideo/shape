class DeprovisionUserWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'low'

  def perform(user_id)
    user = User.find(user_id)

    user.roles.where(
      resource_type: Group.name,
      name: Role::ADMIN,
    ).or(
      user.roles.where(
        resource_type: Collection.name,
        name: Role::EDITOR,
      ),
    ).each do |role|
      case role.resource
      when Group
        other_admin = role.resource.admins[:users].find(&:active?)
        next if other_admin

        if role.resource.admin?
          DeprovisionUserMailer.missing_org_admin(user.id, role.resource.id).deliver_later
        else
          available_org_admins = role.resource.organization.admins[:users].reject(&:archived?)
          if available_org_admins.length.positive?
            available_org_admins.each do |u|
              u.add_role Role::ADMIN, role.resource unless u.archived?
            end
          else
            DeprovisionUserMailer.missing_group_admin(user.id, role.resource.id).deliver_later
          end
        end
      when Collection
        other_editor = role.resource.editors[:users].find(&:active?)
        next if other_editor

        role.resource.organization.admin_group.add_role Role::EDITOR, role.resource
        DeprovisionUserMailer.missing_collection_editor(user.id, role.resource.id).deliver_later
      end
    end
  end
end
