require 'rails_helper'

RSpec.describe Group, type: :model do
  let(:organization) { create(:organization) }
  let(:group) { create(:group, organization: organization) }

  it 'should create a group shared collection' do
    expect(group.current_shared_collection).to be_truthy
  end

  context 'associations' do
    it { should belong_to :filestack_file }
  end

  context 'with users in roles' do
    let!(:admins) { create_list(:user, 3) }
    let!(:members) { create_list(:user, 3) }

    before do
      admins.each { |admin| admin.add_role(Role::ADMIN, group) }
      members.each { |member| member.add_role(Role::MEMBER, group) }
    end

    describe '#admins' do
      it 'should have all admins' do
        expect(group.admins[:users]).to match_array(admins)
      end
    end

    describe '#members' do
      it 'should have all members' do
        expect(group.members[:users]).to match_array(members)
      end
    end
  end

  describe '#archive!' do
    let(:members) { create_list(:users, 3) }
    let(:collection) { create(:collection, organization: organization) }

    before do
      group.add_role(Role::EDITOR, collection)
    end

    it 'removes the group from the collection' do
      expect(collection.editors[:groups]).to include(group)
      group.archive!
      expect(group.archived?).to be true
      expect(collection.editors[:groups]).to be_empty
    end
  end
end
