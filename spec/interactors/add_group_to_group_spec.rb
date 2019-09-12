require 'rails_helper'

RSpec.describe AddGroupToGroup, type: :service do
  # https://stackoverflow.com/questions/43984783/how-do-we-test-interactor-organizers-using-rspec
  describe '#organized' do
    it { expect(AddGroupToGroup.organized).to eq([
      GrantParentAccessToSubgroup,
      GrantParentAccessToChildrenOfSubgroup,
      GrantGrandparentsAccessToSubgroup
      ])
    }
  end

  describe '#call' do
    let(:subgroup) { build_stubbed(:group) }
    let(:parent_group) { build_stubbed(:group) }
    let(:interactor) { AddGroupToGroup.call({ subgroup: build(:group), parent_group: build(:group) }) }

    it 'calls the organized interactors' do
      expect(GrantParentAccessToSubgroup).to receive(:call!).and_return(:success)
      expect(GrantParentAccessToChildrenOfSubgroup).to receive(:call!).and_return(:success)
      expect(GrantGrandparentsAccessToSubgroup).to receive(:call!).and_return(:success)
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
