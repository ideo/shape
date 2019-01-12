require 'rails_helper'

RSpec.describe DeprovisionUserWorker, type: :worker do
  let!(:user) { create(:user, status: :archived) }

  describe '#perform' do
    context 'user is an org admin' do
      let!(:organization) { create(:organization) }
      before do
        user.add_role(Role::ADMIN, organization.admin_group)
      end

      context 'user is the last org admin' do
        it 'notifies ideo support with a zendesk ticket' do
          mailer = double
          expect(mailer).to receive(:deliver_later)
          expect(DeprovisionUserMailer).to receive(:missing_org_admin).with(
            user.id,
            organization.admin_group.id,
          ).and_return(mailer)

          DeprovisionUserWorker.new.perform(user.id)
        end
      end

      context 'user is not the last org admin' do
        let!(:other_user) { create(:user) }

        before do
          other_user.add_role(Role::ADMIN, organization.admin_group)
        end

        it 'does not do anything' do
          expect(DeprovisionUserMailer).not_to receive(:missing_org_admin)
          DeprovisionUserWorker.new.perform(user.id)
        end
      end
    end

    context 'user is an admin of a non-org group' do
      let!(:organization) { create(:organization) }
      let!(:group) { create(:group, organization: organization) }

      before do
        user.add_role(Role::ADMIN, group)
      end

      context 'user is the last admin' do
        context 'there are org admins' do
          let!(:other_org_admin1) { create(:user) }
          let!(:other_org_admin2) { create(:user) }
          let!(:other_org_admin3) { create(:user, status: :archived) }

          before do
            [
              other_org_admin1,
              other_org_admin2,
              other_org_admin3,
            ].each do |org_admin|
              org_admin.add_role(Role::ADMIN, group.organization.admin_group)
            end
          end

          it 'makes the non-archived org admin group users admins of the group' do
            DeprovisionUserWorker.new.perform(user.id)
            expect(other_org_admin1.has_role?(Role::ADMIN, group)).to be true
            expect(other_org_admin2.has_role?(Role::ADMIN, group)).to be true
            expect(other_org_admin3.has_role?(Role::ADMIN, group)).to be false
          end
        end

        context 'there are not org admins' do
          it 'notifies ideo support' do
            mailer = double
            expect(mailer).to receive(:deliver_later)
            expect(DeprovisionUserMailer).to receive(:missing_group_admin).with(
              user.id,
              group.id,
            ).and_return(mailer)

            DeprovisionUserWorker.new.perform(user.id)
          end
        end
      end

      context 'user is not the last admin' do
        let!(:other_user) { create(:user) }

        before do
          other_user.add_role(Role::ADMIN, group)
        end

        it 'does not do anything' do
          expect(DeprovisionUserMailer).not_to receive(:missing_group_admin)
          DeprovisionUserWorker.new.perform(user.id)
        end
      end
    end

    context 'user is a collection editor' do
      let!(:organization) { create(:organization) }
      let!(:collection) { create(:collection, organization: organization) }

      before do
        user.add_role Role::EDITOR, collection
      end

      context 'user is the last editor' do
        it 'notifies the org admins' do
          mailer = double
          expect(mailer).to receive(:deliver_later)
          expect(DeprovisionUserMailer).to receive(:missing_collection_editor).with(
            user.id,
            collection.id,
          ).and_return(mailer)
          DeprovisionUserWorker.new.perform(user.id)
          expect(organization.admin_group.has_role?(Role::EDITOR, collection)).to be true
        end
      end

      context 'user is not the last editor' do
        let!(:other_user) { create(:user) }

        before do
          other_user.add_role Role::EDITOR, collection
        end

        it 'does not need do anything' do
          expect(DeprovisionUserMailer).not_to receive(:missing_collection_editor)
          DeprovisionUserWorker.new.perform(user.id)
          expect(organization.admin_group.has_role?(Role::EDITOR, collection)).to be false
        end
      end
    end
  end
end
