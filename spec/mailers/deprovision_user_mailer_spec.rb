require 'rails_helper'

RSpec.describe DeprovisionUserMailer, type: :mailer do
  let!(:user) { create(:user) }

  describe '#missing_org_admin' do
    let!(:group) { create(:group) }
    let!(:mail) do
      DeprovisionUserMailer.missing_org_admin(user.id, group.id)
    end
    it 'should send to the ideo support email' do
      expect(mail.to).to eql([Shape::ZENDESK_EMAIL])
    end

    it 'renders the subject' do
      expect(mail.subject).to eql("[User Deprovisioned] #{user.email} has been deprovisioned, organization #{group.organization.name} has no organization admin")
    end

    it 'renders the body' do
      expect(mail.body.encoded).to include("#{user.email} was deprovisioned, and now the organization: \"#{group.organization.name}\" has no organization admin.")
      expect(mail.body.encoded).to include('The org is probably in a somewhat broken state.')
    end
  end

  describe '#missing_group_admin' do
    let!(:group) { create(:group) }
    let!(:mail) do
      DeprovisionUserMailer.missing_group_admin(user.id, group.id)
    end
    it 'should send to the ideo support email' do
      expect(mail.to).to eql([Shape::ZENDESK_EMAIL])
    end

    it 'renders the subject' do
      expect(mail.subject).to eql("[User Deprovisioned] #{user.email} has been deprovisioned, group #{group.name} has no admin")
    end

    it 'renders the body' do
      expect(mail.body.encoded).to include("#{user.email} was deprovisioned, and now the group: \"#{group.name}\" has no admin.  No organization admins were available to set as new group admins.")
      expect(mail.body.encoded).to include('The group is probably in a somewhat broken state.')
    end
  end

  describe '#missing_collection_editor' do
    let!(:collection) { create(:collection) }
    let!(:mail) do
      DeprovisionUserMailer.missing_collection_editor(user.id, collection.id)
    end
    it 'should send to the ideo support email' do
      expect(mail.to).to eql([Shape::ZENDESK_EMAIL])
    end

    it 'renders the subject' do
      expect(mail.subject).to eql("[User Deprovisioned] #{user.email} has been deprovisioned, collection #{collection.name} in #{collection.organization.name} organization, set org admins as editors")
    end

    it 'renders the body' do
      expect(mail.body.encoded).to include("#{user.email} was deprovisioned, and now the collection: \"#{collection.name}\" has no primary editor.")
      expect(mail.body.encoded).to include('The org admin group for the collection organization has been added as editor on the collection.')
      expect(mail.body.encoded).to include('The collection may not have any active editors.')
    end
  end
end
