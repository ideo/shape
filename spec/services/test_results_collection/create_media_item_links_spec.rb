require 'rails_helper'

RSpec.describe TestResultsCollection::CreateMediaItemLinks, type: :service do
  let(:test_collection) { create(:test_collection) }
  let!(:test_collection_media_item) do
    create(
      :video_item,
      question_type: :question_media,
      parent_collection: test_collection,
    )
  end
  let!(:ideas_collection_media_item) do
    create(
      :video_item,
      question_type: :question_media,
      parent_collection: test_collection.ideas_collection,
    )
  end
  before do
    # Load in new media item
    test_collection.items.reload
  end
  let(:test_results_collection) { create(:test_results_collection, test_collection: test_collection) }
  subject do
    TestResultsCollection::CreateMediaItemLinks.call(
      test_results_collection: test_results_collection,
    )
  end

  it 'creates a media item link for each item' do
    subject
    expect(
      test_results_collection
        .link_collection_cards
        .map(&:item),
    ).to match_array(
      [test_collection_media_item, ideas_collection_media_item],
    )
  end
end
