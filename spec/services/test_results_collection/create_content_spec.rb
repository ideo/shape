require 'rails_helper'

RSpec.describe TestResultsCollection::CreateContent, type: :service do
  let(:test_collection) { create(:test_collection, :completed) }
  let(:test_results_collection) { test_collection.test_results_collection }
  let(:idea) { test_collection.idea_items.first }
  let(:idea_in_context) { nil }
  let(:survey_response) { nil }

  before do
    [
      TestResultsCollection::CreateContent,
      TestResultsCollection::CreateItemLink,
      TestResultsCollection::CreateIdeasCollection,
      TestResultsCollection::CreateIdeaCollectionCards,
      TestResultsCollection::CreateOpenResponseCollection,
      TestResultsCollection::CreateResponseGraph,
    ].each do |interactor_klass|
      allow(interactor_klass).to receive(:call!).and_call_original
    end
    allow(TestResultsCollection::CreateCollection).to receive(:call).and_call_original

    # create the TestResultsCollection for the content to appear in
    TestResultsCollection::CreateCollection.call(
      test_collection: test_collection,
    )
    if idea_in_context
      TestResultsCollection::CreateCollection.call(
        test_collection: test_collection,
        idea: idea_in_context,
      )
    end
  end

  subject do
    TestResultsCollection::CreateContent.call!(
      test_results_collection: test_results_collection,
      idea: idea_in_context,
    )
  end

  it 'creates media link in the first position' do
    expect(TestResultsCollection::CreateItemLink).to receive(:call!).with(
      hash_including(
        item: idea,
        identifier: 'first-idea-media',
        # it gets put at order 1 until the TestCollection gets moved to the end
        order: 1,
      ),
    )
    expect(subject).to be_a_success
    # now it should be first
    expect(test_results_collection.collection_cards.where(row: 0, col: 0).first.identifier).to eq 'first-idea-media'
    # TODO: not sure how to guarantee this
  end

  it 'places the legend in the 3rd spot' do
    expect(subject).to be_a_success
    expect(
      test_results_collection.collection_cards.where(
        row: 0,
        col: 3,
      ).first.record,
    ).to be_instance_of(Item::LegendItem)
  end

  it 'creates response graphs for all scale questions' do
    test_collection.question_items.scale_questions.each do |question_item|
      expect(TestResultsCollection::CreateResponseGraph).to receive(:call!).with(
        hash_including(
          item: question_item,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  it 'creates open response collections' do
    test_collection.question_items.question_open.each do |question_item|
      expect(TestResultsCollection::CreateOpenResponseCollection).to receive(:call!).with(
        hash_including(
          question_item: question_item,
        ),
      )
    end
    expect(subject).to be_a_success
  end

  it 'moves original test_collection to the end of the results collection' do
    expect(subject).to be_a_success
    expect(
      test_collection
        .test_results_collection
        .collection_cards
        .last
        .collection,
    ).to eq(test_collection)
  end

  it 'creates ideas collection' do
    expect(TestResultsCollection::CreateIdeasCollection).to receive(:call!).with(
      hash_including(
        test_results_collection: test_results_collection,
      ),
    )
    expect(subject).to be_a_success
  end

  it 'calls TestResultsCollection::CreateCollection for the idea' do
    expect(TestResultsCollection::CreateCollection).to receive(:call).with(
      test_collection: test_collection,
      idea: idea,
      created_by: nil,
    )
    expect(subject).to be_a_success
  end

  context 'with multiple ideas' do
    let!(:second_idea_card) do
      create(:collection_card_video, order: 1, parent: test_collection.ideas_collection)
    end
    let(:second_idea) { second_idea_card.item }

    before do
      second_idea.update(content: 'some description')
    end

    it 'calls TestResultsCollection::CreateCollection for each idea' do
      expect(TestResultsCollection::CreateCollection).to receive(:call).with(
        test_collection: test_collection,
        idea: idea,
        created_by: nil,
      )
      expect(TestResultsCollection::CreateCollection).to receive(:call).with(
        test_collection: test_collection,
        idea: second_idea,
        created_by: nil,
      )
      expect(subject).to be_a_success
    end
  end

  context 'with media disabled' do
    it 'does not create media link' do
      test_collection.update(test_show_media: false)
      expect(TestResultsCollection::CreateItemLink).not_to receive(:call!).with(
        hash_including(
          item: idea,
          identifier: 'first-idea-media',
          order: 0,
        ),
      )
      expect(subject).to be_a_success
    end

    it 'archives media link if it was previously added' do
      # Create with media enabled
      TestResultsCollection::CreateContent.call!(
        test_results_collection: test_results_collection,
      )
      media_link = test_results_collection.collection_cards
                                          .identifier('first-idea-media')
                                          .first
      expect(media_link.archived?).to be false

      # Disable media
      test_collection.update(test_show_media: false)
      # Reload so it gets updated setting
      test_results_collection.test_collection.reload

      expect(subject).to be_a_success
      expect(media_link.reload.archived?).to be true
    end
  end

  context 'with idea in the context' do
    let(:idea_in_context) { idea }
    let(:test_results_collection) { idea.test_results_collection }

    it 'links idea media + description inline' do
      expect(test_results_collection).to be_instance_of(Collection::TestResultsCollection)
      expect(TestResultsCollection::CreateIdeaCollectionCards).to receive(:call!).with(
        hash_including(
          parent_collection: test_results_collection,
          idea_item: idea,
        ),
      )
      expect(subject).to be_a_success
      cards = idea.test_results_collection.collection_cards
      expect(
        cards.identifier('idea-1-media').first.record,
      ).to be_instance_of(Item::VideoItem)
      expect(
        cards.identifier('idea-1-description').first.record,
      ).to be_instance_of(Item::TextItem)
    end

    it 'creates media link in the first position' do
      expect(TestResultsCollection::CreateItemLink).to receive(:call!).with(
        hash_including(
          item: idea,
          width: 1,
          height: 2,
          identifier: 'first-idea-media',
        ),
      )
      expect(subject).to be_a_success
      # now it should be first
      expect(test_results_collection.collection_cards.where(row: 0, col: 0).first.identifier).to eq 'first-idea-media'
    end

    it 'does not call TestResultsCollection::CreateCollection on any subcollections' do
      expect(TestResultsCollection::CreateCollection).not_to receive(:call)
      expect(subject).to be_a_success
    end
  end

  context 'with survey response in the context' do
    let!(:survey_response) { create(:survey_response, test_collection: test_collection) }
    let!(:test_results_collection) do
      create(:test_results_collection, test_collection: test_collection, survey_response: survey_response)
    end

    it 'does not call TestResultsCollection::CreateCollection on any subcollections' do
      expect(TestResultsCollection::CreateCollection).not_to receive(:call)
      expect(subject).to be_a_success
    end
  end

  context 'for in-collection test' do
    let(:test_collection) do
      create(:test_collection, :completed, collection_to_test: create(:collection))
    end
    # these default questions will get hidden
    let(:hidden_scale_item) do
      test_collection.collection_cards.hidden.first.item
    end
    let(:hidden_open_response_item) do
      test_collection.collection_cards.hidden.last.item
    end
    let(:visible_scale_items) do
      test_collection
        .question_items
        .scale_questions
        .joins(:parent_collection_card)
        .where(CollectionCard.arel_table[:hidden].eq(false))
    end
    before do
      test_collection.hide_or_show_section_questions!
    end

    it 'does not generate content for hidden cards' do
      visible_scale_items.each do |question_item|
        expect(TestResultsCollection::CreateResponseGraph).to receive(:call!).with(
          hash_including(
            item: question_item,
          ),
        )
      end
      expect(TestResultsCollection::CreateResponseGraph).not_to receive(:call!).with(
        hash_including(
          item: hidden_scale_item,
        ),
      )
      expect(TestResultsCollection::CreateOpenResponseCollection).not_to receive(:call!).with(
        hash_including(
          question_item: hidden_open_response_item,
        ),
      )
      expect(subject).to be_a_success
    end
  end

  context 'with more scaled questions' do
    let!(:scale_questions) { create_list(:question_item, 2, parent_collection: test_collection) }
    let(:legend_item) { test_results_collection.legend_item }
    before do
      scale_questions.each do |question|
        question.parent_collection_card.update(order: 99)
        # put the questions at the end
      end
    end

    it 'should create all test results cards, correctly ordered' do
      expect(subject).to be_a_success
      # legend item should be in the 3rd spot (order == 2)
      expect(legend_item.parent_collection_card.row).to eq 0
      expect(legend_item.parent_collection_card.col).to eq 3
      results_cards = test_results_collection.collection_cards.reload

      expect(
        results_cards.map { |card| [card.record.class.name, card.row, card.col] },
      ).to eq(
        [
          ['Item::VideoItem', 0, 0],
          ['Item::DataItem', 0, 1],
          ['Item::LegendItem', 0, 3],
          ['Collection', 2, 0],
          ['Item::DataItem', 2, 2],
          ['Item::DataItem', 4, 0],
          ['Item::DataItem', 4, 2],
          ['Collection::TestOpenResponses', 6, 0],
          ['Collection::TestOpenResponses', 6, 2],
          ['Item::DataItem', 7, 0],
          ['Item::DataItem', 7, 2],
          ['Collection', 9, 0],
          ['Collection::TestResultsCollection', 9, 1],
          ['Collection::TestCollection', 9, 2],
        ]
      )
    end
  end

  it 'appends feedback design to the test collection name' do
    prev_name = test_collection.name
    expect(subject).to be_a_success
    expect(test_collection.reload.name).to eq(
      prev_name + Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX,
    )
  end

  it 'moves test collection to be inside results collection' do
    expect(subject).to be_a_success
    expect(test_results_collection.collections).to include(test_collection)
  end

  context 'updating roles' do
    context 'with roles on test collection' do
      let(:editor) { create(:user) }
      before do
        test_collection.unanchor_and_inherit_roles_from_anchor!
        # Test Results Collection already created in outer before block
        test_results_collection.update(roles_anchor_collection: nil)
        editor.add_role(Role::EDITOR, test_collection)
      end

      it 'moves roles to results collection' do
        role = test_collection.roles.first
        expect(subject).to be_a_success

        test_collection.reload
        expect(test_results_collection.roles).to eq([role])
        expect(test_collection.roles.reload).to be_empty
        expect(test_collection.roles_anchor).to eq(test_results_collection)
      end

      it 'correctly anchors the children (items and ideas collection)' do
        expect(subject).to be_a_success
        expect(
          test_collection.children.all? { |child| child.roles_anchor == test_results_collection }
        ).to be true
      end
    end

    context 'with test collection anchored to another collection' do
      let(:parent) { test_collection.parent }

      it 'keeps everything anchored to the original roles anchor' do
        expect(test_collection.roles_anchor).to eq parent
        expect(subject).to be_a_success
        collections = [test_results_collection] + [test_collection] + test_collection.children
        expect(collections.all? { |c| c.roles_anchor == parent }).to be true
      end
    end
  end
end
