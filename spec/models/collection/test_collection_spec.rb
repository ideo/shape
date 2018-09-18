require 'rails_helper'

describe Collection::TestCollection, type: :model do
  let(:test_collection) { create(:test_collection) }

  context 'associations' do
    it { should have_many :survey_responses }
  end

  context 'callbacks' do
    describe '#setup_default_status_and_questions' do
      it 'should set the test_status to "draft"' do
        expect(test_collection.test_status).to eq 'draft'
      end

      it 'should create the default setup with its attached cards and items' do
        expect(test_collection.collection_cards.count).to eq 3
        expect(test_collection.items.count).to eq 3
      end
    end

    describe '#add_test_tag' do
      it 'should add the #test tag after_create' do
        expect(test_collection.cached_owned_tag_list).to match_array(['test'])
      end
    end
  end

  describe '#create_uniq_survey_response' do
    it 'should create a survey response with a unique session_uid' do
      expect {
        test_collection.create_uniq_survey_response
      }.to change(test_collection.survey_responses, :count).by(1)
      expect(test_collection.survey_responses.last.session_uid).not_to be nil
    end
  end

  context 'launching a test' do
    let(:user) { create(:user) }

    describe '#launch_test!' do
      context 'with valid draft collection (default status)' do
        before do
          expect(test_collection.launch_test!(initiated_by: user)).to be true
        end

        it 'should create a TestDesign collection and move the questions into it' do
          expect(test_collection.test_design.present?).to be true
          # should have moved the 3 default cards into there
          expect(test_collection.test_design.collection_cards.count).to eq 3
          expect(test_collection.test_design.collection_cards.map(&:order)).to match_array([0, 1, 2])
          # now the test_collection should just have the 1 card
          expect(test_collection.collection_cards.count).to eq 1
        end

        it 'should update the status to "live"' do
          expect(test_collection.live?).to be true
        end
      end

      context 'with invalid collection' do
        before do
          # the before_create sets it as draft, so we do this after creation
          test_collection.update(test_status: :live)
        end

        it 'returns false with test_status errors' do
          expect(test_collection.launch_test!(initiated_by: user)).to be false
          expect(test_collection.errors).to match_array(['Test status must be in draft mode in order to launch'])
        end
      end
    end

    describe '#serialized_for_test_survey' do
      before do
        test_collection.launch_test!(initiated_by: user)
      end

      it 'should output its collection_cards from the test_design child collection' do
        data = test_collection.serialized_for_test_survey
        card_ids = test_collection.test_design.collection_cards.map(&:id).map(&:to_s)
        expect(data[:data][:relationships][:collection_cards][:data].map{ |i| i[:id] }).to match_array(card_ids)
      end
    end
  end
end
