require 'rails_helper'

describe Collection::TestDesign, type: :model do
  let!(:test_collection) { create(:test_collection, :launched) }
  let(:test_results_collection) { test_collection.test_results_collection }
  # simulate legacy content
  let!(:legacy_content) { create_list(:collection_card_text, 3, parent: test_results_collection) }

  describe '#migrate!' do
    before do
      @tc_id = test_collection.id
      @trc_id = test_results_collection.id
      test_collection.update(type: 'Collection::TestDesign')
      test_collection.test_results_collection.update(type: 'Collection::TestCollection')

      @test_design = Collection.find(@tc_id)
      @test_collection = Collection.find(@trc_id)
      @test_collection.update(test_status: :live)
      # move it inside
      @test_design.parent_collection_card.update_columns(parent_id: @trc_id)
      # simulate the old setup
      @test_design.update(test_collection: @test_collection)
      @test_design.collections.destroy_all
      @test_design.collection_cards.update_all(
        section_type: nil,
      )
      @test_design.save
      # now migrate and switch the meaning of @test_collection
      @test_design.migrate!
      @test_collection = Collection.find(@test_design.id)
    end

    it 'should migrate' do
      expect(@test_collection.class).to eq(Collection::TestCollection)

      test_results = @test_collection.test_results_collection
      expect(test_results.class).to eq(Collection::TestResultsCollection)
      expect(test_results.id).to eq(@trc_id)
      expect(test_results.collections).to include(@test_collection)

      previous_results = test_results.collections.where(name: 'Previous Results').first
      expect(previous_results.collection_cards).to match_array legacy_content
    end

    it 'should work for duplication' do
      expect(@test_collection.ideas_collection).to be nil
      dupe = @test_collection.duplicate!(parent: create(:collection))
      expect(dupe.ideas_collection).not_to be nil
    end

    it 'should be able to migrate from V1 TestCollection to have ideas' do
      expect(@test_collection.ideas_collection).to be nil
      expect(@test_collection.collection_cards.map(&:section_type).compact).to be_empty

      # now call the OTHER migrate! this should properly set up ideas collection, etc
      @test_collection.migrate!
      @test_collection.reload
      ideas_collection = @test_collection.ideas_collection
      expect(ideas_collection).not_to be nil
      expect(ideas_collection.items.first.name).to be_blank
      expect(ideas_collection.items.first.question_type).to eq 'question_idea'
      expect(@test_collection.collection_cards.map(&:section_type).uniq).to match_array %w[ideas outro]
    end

    context 'with a video item that we can turn into an idea' do
      let!(:video_card) { create(:collection_card_video, parent: test_collection, section_type: :ideas) }
      before do
        # more simulating legacy
        @test_collection.collection_cards.update_all(section_type: nil)
        # do other migration
        @test_collection.migrate!
        @test_collection.reload
      end

      it 'migrates question into the Ideas collection' do
        expect(video_card.reload.parent.name).to eq 'Ideas'
        expect(video_card.reload.parent.parent).to eq @test_collection
      end
    end
  end
end
