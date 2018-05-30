require 'rails_helper'

RSpec.describe ActivityAndNotificationBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:actor) { create(:user, add_to_org: organization) }
  let(:target) { create(:collection) }
  let(:action) { Activity.actions[:archived] }
  let(:subject_users) { create_list(:user, 1) }
  let(:subject_groups) { [] }
  let(:combine) { false }
  let(:builder) do
    ActivityAndNotificationBuilder.new(
      actor: actor,
      target: target,
      action: action,
      subject_users: subject_users,
      subject_groups: subject_groups,
      combine: combine,
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

    context 'when combining' do
      let(:combine) { true }
      let(:action) { Activity.actions[:commented] }
      let(:actor2) { create(:user, add_to_org: organization) }
      let(:actor3) { create(:user, add_to_org: organization) }
      let(:actors) { [actor2, actor3] }

      before do
        actors.each do |user|
          ActivityAndNotificationBuilder.new(
            actor: user,
            target: target,
            action: action,
            subject_users: subject_users,
          ).call
        end
      end

      it 'destroys the previous 3 notifications' do
        expect(Notification.count).to eq 2
        expect { builder.call }.to change(Notification, :count).by(-1)
      end

      it 'creates one notification with many combined activities' do
        builder.call
        notification = Notification.last
        expect(notification.combined_activities_ids.count).to eq 3
      end
    end
  end
end
