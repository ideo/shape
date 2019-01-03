class DeprovisionUserMailer < ApplicationMailer
  def missing_org_admin(user_id, group_id)
    @user = User.find(user_id)
    @group = Group.find(group_id)
    @subject = "[User Deprovisioned] #{@user.email} has been deprovisioned, organization #{@group.organization.name} has no organization admin"
    mail to: Shape::ZENDESK_EMAIL, subject: @subject
  end

  def missing_group_admin(user_id, group_id)
    @user = User.find(user_id)
    @group = Group.find(group_id)
    @subject = "[User Deprovisioned] #{@user.email} has been deprovisioned, group #{@group.name} has no admin"
    mail to: Shape::ZENDESK_EMAIL, subject: @subject
  end

  def missing_collection_editor(user_id, collection_id)
    @user = User.find(user_id)
    @collection = Collection.find(collection_id)
    @subject = "[User Deprovisioned] #{@user.email} has been deprovisioned, collection #{@collection.name} in #{@collection.organization.name} organization, set org admins as editors"
    mail to: Shape::ZENDESK_EMAIL, subject: @subject
  end
end
