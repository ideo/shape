class DeprovisionUserMailerPreview < ActionMailer::Preview
  def missing_org_admin
    user = User.last
    group = user.current_organization.admin_group
    DeprovisionUserMailer.missing_org_admin(user.id, group.id)
  end

  def missing_group_admin
    user = User.last
    group = user.current_organization.admin_group
    DeprovisionUserMailer.missing_group_admin(user.id, group.id)
  end

  def missing_collection_editor
    user = User.last
    collection = user.collections.last
    DeprovisionUserMailer.missing_collection_editor(user.id, collection.id)
  end
end
