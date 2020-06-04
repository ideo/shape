require 'rails_helper'

RSpec.describe ChallengeRelevantPhaseCollections, type: :service do
  let(:user) { create(:user) }
  let(:start_date) { 5.days.ago }
  let(:end_date) { 10.days.from_now }
  let!(:challenge) do
    create(
      :collection,
      num_cards: 3,
      record_type: :collection,
      add_viewers: [user],
      collection_type: :challenge,
    )
  end
  subject do
    ChallengeRelevantPhaseCollections.call(
      collection: challenge,
      for_user: user,
    )
  end

  describe '#call' do
    context 'no sub-collections with phases' do
      it 'returns no phases' do
        expect(subject).to be_empty
      end
    end

    context 'one sub-collection with phases' do
      let(:phase_collections) { challenge.collections.first(2) }
      before do
        phase_collections.each do |collection|
          collection.update(collection_type: :phase, start_date: start_date, end_date: end_date)
        end
      end

      it 'returns phases' do
        expect(subject).to eq(phase_collections)
      end

      context 'two nested sub-collections with phases' do
        let!(:nested_phase_collection) do
          create(
            :collection,
            :phase,
            add_viewers: [user],
            parent_collection: phase_collections.first,
          )
        end
        before do
          # Make sure the test is setup correctly
          expect(
            challenge.all_child_collections.where(collection_type: :phase),
          ).to match_array(phase_collections + [nested_phase_collection])
        end

        it 'returns first descendant phases' do
          expect(subject).to match_array(phase_collections)
        end
      end

      context 'with some hidden phases' do
        let(:hidden_phase) { phase_collections.first }
        before do
          hidden_phase.update(roles_anchor_collection_id: 123)
        end

        it 'returns only collections user can view' do
          expect(subject).to match_array(phase_collections - [hidden_phase])
        end
      end

      context 'with phase collection that is linked in' do
        let!(:linked_phase_collection) do
          create(
            :collection,
            :phase,
            add_viewers: [user],
            card_relation: :link,
            parent_collection: challenge,
          )
        end

        it 'returns all phase collections' do
          expect(subject).to match_array(phase_collections + [linked_phase_collection])
        end
      end
    end

    context 'two sibling sub-collections with phases' do
      let!(:sibling_phase_collection_1) do
        create(
          :collection,
          :phase,
          add_viewers: [user],
          parent_collection: challenge.collections.first,
        )
      end
      let!(:sibling_phase_collection_2) do
        create(
          :collection,
          :phase,
          add_viewers: [user],
          parent_collection: challenge.collections.second,
        )
      end

      it 'returns no phases' do
        expect(subject).to be_empty
      end
    end

    context 'parent challenge collection with phases' do
      let(:parent_challenge) do
        create(
          :collection,
          num_cards: 1,
          record_type: :collection,
          add_viewers: [user],
          collection_type: :challenge,
        )
      end
      before do
        # Turn challenge into regular collection first
        challenge.update(collection_type: 'collection')
        # Attach previous challenge to parent
        parent_challenge.collection_cards.first.update(collection: challenge)
      end
      let!(:parent_phase_collection) do
        create(
          :collection,
          :phase,
          add_viewers: [user],
          parent_collection: parent_challenge,
        )
      end
      subject do
        ChallengeRelevantPhaseCollections.call(
          collection: parent_challenge,
          for_user: user,
        )
      end

      it 'returns parent challenge collection phases' do
        expect(subject).to eq([parent_phase_collection])
      end
    end
  end
end
