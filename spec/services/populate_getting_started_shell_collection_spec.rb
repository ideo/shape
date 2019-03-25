require 'rails_helper'

RSpec.describe PopulateGettingStartedShellCollection, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:getting_started_collection) do
    create(:global_collection, num_cards: 3, record_type: :collection, organization: organization)
  end
  let(:shape_tutorial) { getting_started_collection.collections.first }
  let!(:shape_use_cases) { create(:collection, parent_collection: shape_tutorial) }
  let!(:shape_use_cases_cards) { create_list(:collection_card_text, 3, parent: shape_use_cases) }
  let(:user_shape_tutorial) { user.current_user_collection.collections.find_by(cloned_from: shape_tutorial) }
  let(:user_shape_use_cases) { user_shape_tutorial.collections.first }

  let(:service) do
    PopulateGettingStartedShellCollection.new(
      user_shape_use_cases,
      for_user: user,
    )
  end

  before do
    organization.update(getting_started_collection: getting_started_collection)
    organization.setup_user_membership_and_collections(user, synchronous: true)
  end

  it 'starts off with the proper setup, with cards from getting_started duplicated into my collection' do
    expect(user_shape_tutorial).not_to be nil
    # the user has their copy of "shape use cases"
    expect(user_shape_use_cases.cloned_from).to eq shape_use_cases
    # the original collection has 3 items
    expect(shape_use_cases.items.count).to eq 3
    # the cloned one does not, and is marked as "getting_started_shell"
    expect(user_shape_use_cases.items.count).to eq 0
    expect(user_shape_use_cases.getting_started_shell).to eq true
  end

  describe '#call' do
    it 'populates the shell collection by duplicating the cards from the original' do
      expect(user_shape_use_cases.items.count).to eq 0
      service.call
      user_shape_use_cases.reload
      shape_use_cases.reload
      expect(user_shape_use_cases.items.count).to eq 3
      expect(user_shape_use_cases.items.map(&:cloned_from)).to match_array shape_use_cases.items
    end

    it 'passes appropriate options to CollectionCardDuplicator' do
      expect(CollectionCardDuplicator).to receive(:call).with(
        to_collection: user_shape_use_cases,
        cards: shape_use_cases.collection_cards,
        placement: 'beginning',
        for_user: user,
        system_collection: true,
      )
      service.call
    end

    it 'unsets getting_started_shell' do
      expect(user_shape_use_cases.getting_started_shell).to be true
      service.call
      expect(user_shape_use_cases.getting_started_shell).to be false
    end
  end
end
