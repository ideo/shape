require 'rails_helper'

describe Collection::TestCollection, type: :model do
  let(:user) { create(:user) }
  let(:test_collection) { create(:test_collection) }

  context 'associations' do
    it { should have_many :survey_responses }
    it { should have_many :prelaunch_question_items }
    it { should have_one :test_design }
    it { should belong_to :collection_to_test }
  end

  context 'callbacks' do
    describe '#setup_default_status_and_questions' do
      it 'should set the test_status to "draft"' do
        expect(test_collection.test_status).to eq 'draft'
      end

      it 'should create the default setup with its attached cards and items' do
        expect(test_collection.collection_cards.count).to eq 4
        expect(test_collection.items.count).to eq 4
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
      expect do
        test_collection.create_uniq_survey_response
      end.to change(test_collection.survey_responses, :count).by(1)
      expect(test_collection.survey_responses.last.session_uid).not_to be nil
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let!(:parent_collection) { create(:collection) }
    let(:duplicate) do
      test_collection.duplicate!(
        for_user: user,
        copy_parent_card: false,
        parent: parent_collection,
      )
    end

    before do
      user.add_role(Role::EDITOR, parent_collection)
      user.add_role(Role::EDITOR, test_collection)
      test_collection.children.each do |record|
        user.add_role(Role::EDITOR, record)
      end

      # Run background jobs to clone cards
      Sidekiq::Testing.inline!
    end

    after do
      Sidekiq::Testing.fake!
    end

    context 'if in draft status' do
      let!(:test_collection) { create(:test_collection) }
      before do
        expect(test_collection.draft?).to be true
      end

      it 'copies collection' do
        expect {
          duplicate
        }.to change(Collection, :count).by(1)
        expect(duplicate).to be_instance_of(Collection::TestCollection)
        expect(duplicate.draft?).to be true
      end

      it 'has prelaunch question items' do
        expect(
          duplicate.prelaunch_question_items.pluck(:question_type),
        ).to match_array(
          test_collection.question_items.pluck(:question_type),
        )
      end

      it 'renames it to Copy of {name}' do
        expect(duplicate.name).to eq("Copy of #{test_collection.name}")
      end
    end

    context 'if live' do
      let(:test_collection) { create(:test_collection, :completed) }
      before do
        test_collection.launch!(initiated_by: user)
        expect(test_collection.live?).to be true
      end
      let!(:survey_response) do
        create(:survey_response, test_collection: test_collection)
      end

      it 'only copies test design' do
        expect {
          duplicate
        }.to change(Collection, :count).by(1)
        expect(duplicate).to be_instance_of(Collection::TestCollection)
        expect(duplicate.draft?).to be true
      end

      it 'has prelaunch question items' do
        expect(
          duplicate.prelaunch_question_items.pluck(:question_type),
        ).to match_array(
          test_collection.question_items.pluck(:question_type),
        )
      end

      it 'does not have any responses' do
        expect(duplicate.survey_responses.count).to eq(0)
      end

      it 'renames it to Copy of {name}' do
        expect(duplicate.name).to eq("Copy of #{test_collection.name}")
      end

      it 'no longer has a test_collection' do
        expect(duplicate.test_collection_id).to be_nil
      end

      context 'if template instance' do
        let(:template) { create(:collection, master_template: true) }
        let(:parent_collection) { create(:collection) }
        let!(:test_template_instance) do
          create(:test_collection,
                 :completed,
                 parent_collection: parent_collection,
                 collection_to_test: parent_collection,
                 template: template)
        end
        before do
          test_template_instance.launch!(initiated_by: user)
          expect(test_template_instance.live?).to be true
        end

        it 'moves templated_from to TestDesign' do
          expect(test_template_instance.template).to be_nil
          expect(
            test_template_instance.test_design.template,
          ).to eq(template)
        end

        it 'keeps collection_to_test on TestCollection' do
          expect(
            test_template_instance.collection_to_test,
          ).to eq(parent_collection)
        end
      end

      context 'if closed' do
        before do
          test_collection.close!
          expect(test_collection.closed?).to be true
        end

        it 'only copies test design' do
          expect {
            duplicate
          }.to change(Collection, :count).by(1)
          expect(duplicate).to be_instance_of(Collection::TestCollection)
          expect(duplicate.draft?).to be true
        end

        it 'has prelaunch question items' do
          expect(
            duplicate.prelaunch_question_items.pluck(:question_type),
          ).to match_array(
            test_collection.question_items.pluck(:question_type),
          )
        end

        it 'does not have any responses' do
          expect(duplicate.survey_responses.count).to eq(0)
        end

        it 'renames it to Copy of {name}' do
          expect(duplicate.name).to eq("Copy of #{test_collection.name}")
        end
      end
    end
  end

  context 'with a ready to launch test' do
    let!(:test_collection) { create(:test_collection, :completed) }

    context 'launching a test' do
      describe '#launch!' do
        context 'with valid draft collection (default status)' do
          it 'should create a TestDesign collection and move the questions into it' do
            expect(test_collection.test_design.present?).to be false
            expect(test_collection.errors).to match_array([])
            # call launch!
            expect(test_collection.launch!(initiated_by: user)).to be true
            expect(test_collection.test_design.created_by).to eq user
            expect(test_collection.test_design.present?).to be true
            # should have moved the default question cards into there
            expect(
              test_collection
              .test_design
              .collection_cards
              .map(&:card_question_type)
              .map(&:to_sym),
            ).to eq(
              Collection::TestCollection.default_question_types,
            )
            expect(
              test_collection.test_design.collection_cards.map(&:order),
            ).to eq([0, 1, 2, 3])
            # now the test_collection should have the chart item, test design in that order
            expect(
              test_collection
              .collection_cards
              .reload
              .map { |card| card.record.class },
            ).to eq(
              [
                Item::ChartItem,
                Collection::TestDesign,
              ],
            )
          end

          it 'should update the status to "live"' do
            expect(test_collection.launch!(initiated_by: user)).to be true
            expect(test_collection.live?).to be true
          end

          it 'should create a chart item for each scale question' do
            expect do
              test_collection.launch!(initiated_by: user)
            end.to change(
              Item::ChartItem, :count
            ).by(test_collection.question_items.select { |q| q.question_context? || q.question_useful? }.size)
          end

          context 'with open response questions' do
            let!(:test_collection) { create(:test_collection, :open_response_questions) }

            it 'creates a TestOpenResponse collection for each item' do
              expect do
                test_collection.launch!(initiated_by: user)
              end.to change(
                Collection::TestOpenResponses, :count
              ).by(test_collection.question_items.size)

              expect(
                test_collection
                  .test_design
                  .question_items
                  .all?(&:test_open_responses_collection),
              ).to be true
            end
          end

          describe '#serialized_for_test_survey' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'should output its collection_cards from the test_design child collection' do
              data = test_collection.serialized_for_test_survey
              card_ids = test_collection.test_design.collection_cards.map(&:id).map(&:to_s)
              expect(data[:data][:relationships][:question_cards][:data].map { |i| i[:id] }).to match_array(card_ids)
            end
          end
        end

        context 'with invalid collection' do
          before do
            # the before_create sets it as draft, so we do this after creation
            test_collection.update(test_status: :live)
          end

          it 'returns false with test_status errors' do
            expect(test_collection.launch!(initiated_by: user)).to be false
            expect(test_collection.errors).to match_array(["You can't launch because the feedback is live"])
          end
        end
      end

      describe '#close!' do
        before do
          test_collection.launch!(initiated_by: user)
        end

        it 'should set status as closed' do
          expect(test_collection.close!).to be true
          expect(test_collection.closed?).to be true
        end
      end

      describe '#reopen!' do
        before do
          test_collection.launch!(initiated_by: user)
          test_collection.close!
        end

        it 'should set status as live' do
          expect(test_collection.reopen!).to be true
          expect(test_collection.live?).to be true
        end
      end

      describe '#serialized_for_test_survey' do
        before do
          test_collection.launch!(initiated_by: user)
        end

        it 'should output its collection_cards from the test_design child collection' do
          data = test_collection.serialized_for_test_survey
          card_ids = test_collection.test_design.collection_cards.map(&:id).map(&:to_s)
          expect(data[:data][:relationships][:question_cards][:data].map { |i| i[:id] }).to match_array(card_ids)
        end
      end
    end
  end

  context 'with a non-ready test with incomplete questions' do
    let(:test_collection) { create(:test_collection) }

    it 'returns false with test_status errors' do
      expect(test_collection.launch!(initiated_by: user)).to be false
      expect(test_collection.errors).to match_array([
        'Please add an image or video for your idea to question 1',
        'Please add your idea description to question 2',
      ])
    end
  end
end
