require 'rails_helper'

RSpec.describe Group, type: :model do
  let(:organization) { create(:organization) }
  let(:group) { create(:group, organization: organization) }

  context 'with users in roles' do
    let!(:admins) { create_list(:user, 3) }
    let!(:members) { create_list(:user, 3) }
    let!(:guests) { create_list(:user, 3) }

    before do
      admins.each { |admin| admin.add_role(:admin, group) }
      members.each { |member| member.add_role(:member, group) }
      guests.each { |guest| guest.add_role(:guest, group) }
    end

    describe '#admins' do
      it 'should have all admins' do
        expect(group.admins).to match_array(admins)
      end
    end

    describe '#members' do
      it 'should have all members' do
        expect(group.members).to match_array(members)
      end
    end

    describe '#admins_and_members' do
      it 'should have all admins and members' do
        expect(group.admins_and_members).to match_array(admins + members)
      end
    end

    describe '#guests' do
      it 'should have all guests' do
        expect(group.guests).to match_array(guests)
      end
    end
  end
end
