require 'rails_helper'

RSpec.describe ActivityAndNotificationBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:actor) { create(:user, add_to_org: organization) }
  let(:target) { create(:collection) }
  let(:action) { 1 }
  let(:subject_users) { create_list(:user, 1) }
  let(:subject_groups) { [] }
  let(:builder) do
    ActivityAndNotificationBuilder.new(
      actor: actor,
      target: target,
      action: action,
      subject_users: subject_users,
      subject_groups: subject_groups,
    )
  end

  describe '#call' do
    it 'creates one new activity' do
      expect { builder.call }.to change(Activity, :count).by(1)
    end

    context 'with muliple users' do
      let(:subject_users) { create_list(:user, 2) }

      it 'creates notifications for each user' do
        expect { builder.call }.to change(Notification, :count).by(2)
      end
    end

    context 'with a user and a group' do
      let(:subject_groups) { [create(:group, add_members: [create(:user)])] }

      it 'creates notifications for each user and each user in group' do
        expect { builder.call }.to change(Notification, :count).by(2)
      end
    end

    context 'with a user in the same group' do
      let(:subject_groups) { [create(:group, add_members: [subject_users.first])] }

      it 'does not create two notifications for the user' do
        expect { builder.call }.to change(Notification, :count).by(1)
      end
    end
  end
end
