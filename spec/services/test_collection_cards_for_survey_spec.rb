require 'rails_helper'

RSpec.describe TestCollectionCardsForSurvey, type: :service do
  let!(:test_collection) { create(:test_collection, :completed) }
  let(:service) { TestCollectionCardsForSurvey.new(test_collection) }
  let(:survey_cards) { service.call }
  let(:idea_cards) { test_collection.idea_cards }
  let(:idea_question_cards) do
    survey_cards.select { |card| card.section_type.to_s == 'ideas' }
  end
  let(:num_default_question_items) do
    Collection::TestCollection.default_question_types_by_section.values.flatten.size
  end

  it 'collects cards in their appropriate sections' do
    # ideas section has 5 cards
    sections = ['intro']
    sections += ['ideas'] * 5
    sections += ['outro'] * 2
    expect(survey_cards.map(&:section_type)).to eq(sections)
  end

  context 'with multiple ideas' do
    let!(:test_collection) { create(:test_collection, :completed, :two_ideas) }

    it 'collects cards in their appropriate sections, once per idea' do
      # ideas section has 5 cards, there are 2 ideas
      sections = ['intro']
      sections += ['ideas'] * 10
      sections += ['outro'] * 2
      expect(survey_cards.map(&:section_type)).to eq(sections)
    end

    it 'collects the idea section cards for each idea' do
      idea_ids = idea_cards.map(&:item_id) * 5
      # we use match_array because the idea order is randomized
      expect(idea_question_cards.map(&:idea_id)).to match_array(idea_ids)
    end

    context 'switching to in-collection test' do
      let(:collection_to_test) { create(:collection) }
      before do
        test_collection.update(collection_to_test: collection_to_test)
      end

      it 'only collects the idea section once' do
        sections = ['intro']
        # does not collect ideas cards x2
        sections += ['ideas'] * 5
        sections += ['outro'] * 2
        expect(survey_cards.map(&:section_type)).to eq(sections)
      end
    end
  end

  context 'with incomplete cards' do
    let!(:extra_question_cards) do
      create_list(:collection_card_question, 4, parent: test_collection)
    end

    before do
      test_collection.launch!(initiated_by: create(:user))

      card = extra_question_cards.first
      # incomplete because it doesn't have content
      card.item.update(question_type: :question_open)
      card = extra_question_cards.second
      # incomplete because it doesn't have content
      card.item.update(question_type: :question_category_satisfaction)
      card = extra_question_cards.third
      # incomplete because it doesn't have a type
      card.item.update(question_type: nil)
      card = extra_question_cards.fourth
      # incomplete because it doesn't have media
      card.item.update(question_type: :question_media)
    end

    it 'should only get completed question cards' do
      # all the default cards, minus ideas collection + 4 incomplete
      expect(test_collection.items.count).to eq(num_default_question_items - 1 + 4)
      # all the default cards only (minus media because it gets removed)
      expect(survey_cards & extra_question_cards).to be_empty
    end
  end
end
