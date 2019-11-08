# compile the collection cards for multiple ideas
class TestCollectionCardsForSurvey < SimpleService
  delegate :collection_cards, to: :@test_collection

  def initialize(test_collection)
    @test_collection = test_collection
    @cards = []
    @idea_cards = []
  end

  def call
    randomize_idea_order
    collect_complete_cards_for_section(:intro)
    collect_idea_cards
    collect_complete_cards_for_section(:outro)
    @cards
  end

  private

  def randomize_idea_order
    # simple enough way to randomize?
    @idea_cards = @test_collection.idea_cards.shuffle
  end

  def collect_idea_cards
    section_cards = complete_cards_for_section(:ideas)
    @idea_cards.each do |idea_card|
      @cards += section_cards.map do |section_card|
        # replace Ideas Collection with the Idea itself
        question_card = section_card.collection_id? ? idea_card : section_card
        # clone so that we can set the idea_id differently in multiple iterations
        question_card = question_card.clone
        question_card.section_type = :ideas
        # set this attr_accessor
        question_card.idea_id = idea_card.item_id
        question_card
      end
    end
  end

  def collect_complete_cards_for_section(section_type)
    @cards += complete_cards_for_section(section_type)
  end

  def complete_cards_for_section(section_type)
    collection_cards
      .where(section_type: section_type)
      .includes(:item)
      .reject { |card| card.item&.question_item_incomplete? }
  end
end
