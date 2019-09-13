require 'rails_helper'

RSpec.describe RemoveGroupFromGroup, type: :service do
  # https://stackoverflow.com/questions/43984783/how-do-we-test-interactor-organizers-using-rspec
  describe '#organized' do
    it 'organizes all of the related interactors ' do
      expect(RemoveGroupFromGroup.organized).to eq([
        RevokeMembershipToGroup,
        RemoveChildrenOfSubgroup,
      ])
    end
  end

  describe '#call' do
    let(:subgroup) { create(:group) }
    let(:parent_group) { create(:group) }
    let(:interactor) { RemoveGroupFromGroup.call(subgroup: subgroup, parent_group: parent_group) }

    before do
      GroupHierarchy.create(
        parent_group: parent_group,
        granted_by: parent_group,
        subgroup: subgroup
      )
    end

    it 'calls the organized interactors' do
      expect(RevokeMembershipToGroup).to receive(:call!).and_return(:success)
      expect(RemoveChildrenOfSubgroup).to receive(:call!).and_return(:success)
      interactor
    end

    it 'returns a context' do
      expect(interactor).to be_kind_of(Interactor::Schema::Context)
    end

    it 'returned context is successful' do
      expect(interactor.success?).to eq true
    end
  end
end
