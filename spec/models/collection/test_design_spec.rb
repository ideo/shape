require 'rails_helper'

describe Collection::TestDesign, type: :model do
  let!(:test_collection) { create(:test_collection, :launched) }
  let!(:test_audience) { create(:test_audience, :link_sharing, test_collection: test_collection) }
  let!(:survey_responses) do
    create_list(:survey_response, 2, :fully_answered, test_collection: test_collection, test_audience: test_audience)
  end
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
      @test_collection.collection_cards.update_all(section_type: nil)
      survey_responses.each { |sr| sr.update(respondent_alias: nil) }
      @test_design.update(test_collection: @test_collection)
      @test_design.collections.destroy_all
      @test_design.collection_cards.update_all(
        section_type: nil,
      )
      @test_design.save
      # now migrate and switch the meaning of @test_collection
      Sidekiq::Testing.inline! do
        @test_design.migrate!
      end
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
      expect(test_results.collection_cards.last.record.name).to eq 'Previous Results'

      all_responses = test_results.collections.third
      expect(all_responses.name).to eq 'All Responses'
      # 1 for audience, 1 per survey response
      expect(all_responses.collections.count).to eq 3
    end

    it 'should work for duplication' do
      expect(@test_collection.ideas_collection).to be nil
      dupe = @test_collection.duplicate!(parent: create(:collection))
      expect(dupe.ideas_collection).not_to be nil
    end

    # TODO: could move these tests into test_collection.migrate when migrating a draft test
    # it 'should be able to migrate from V1 TestCollection to have ideas' do
    #   ideas_collection = @test_collection.ideas_collection
    #   expect(ideas_collection).not_to be nil
    #   expect(ideas_collection.items.first.name).to be_blank
    #   expect(ideas_collection.items.first.question_type).to eq 'question_idea'
    #   expect(@test_collection.collection_cards.map(&:section_type).uniq).to match_array %w[ideas outro]
    # end
    #
    # context 'with a video item that we can turn into an idea' do
    #   let!(:video_card) { create(:collection_card_video, parent: test_collection, section_type: :ideas) }
    #
    #   it 'migrates question into the Ideas collection' do
    #     expect(video_card.parent.name).to eq 'Ideas'
    #     expect(video_card.parent.parent).to eq @test_collection
    #   end
    # end
    #
    # context 'with a blank question item that we can turn into an idea' do
    #   let!(:blank_question_card) { create(:collection_card_question, parent: test_collection) }
    #   let!(:blank_question_card2) { create(:collection_card_question, order: 99, parent: test_collection) }
    #
    #   before do
    #     # more simulating legacy
    #     blank_question_card.item.update(question_type: nil)
    #     blank_question_card2.item.update(question_type: nil)
    #     @test_collection.collection_cards.update_all(section_type: nil)
    #     # do other migration
    #     @test_collection.migrate!
    #     @test_collection.reload
    #     blank_question_card.reload
    #     blank_question_card2.reload
    #   end
    #
    #   it 'migrates question into the Ideas collection' do
    #     expect(blank_question_card.parent.name).to eq 'Ideas'
    #     expect(blank_question_card.parent.parent).to eq @test_collection
    #     expect(blank_question_card.item.question_idea?).to be true
    #
    #     expect(blank_question_card2.parent).to eq @test_collection
    #     expect(blank_question_card2.item.question_media?).to be true
    #   end
    # end
  end
end
