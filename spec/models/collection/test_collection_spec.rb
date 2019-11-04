require 'rails_helper'

describe Collection::TestCollection, type: :model do
  let(:user) { create(:user) }
  let(:test_parent) { create(:collection, add_editors: [user]) }
  let(:test_collection) do
    create(:test_collection, parent_collection: test_parent, roles_anchor_collection: test_parent)
  end

  context 'associations' do
    it { should have_many :survey_responses }
    it { should have_many :prelaunch_question_items }
    it { should have_many :test_audiences }
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

      it 'sets up the anchored roles on the items' do
        expect(test_collection.roles_anchor_collection_id).to eq test_parent.id
        test_collection.reload
        items = test_collection.items
        item = items.first
        expect(items.all? { |i| i.roles_anchor_collection_id == test_parent.id }).to be true
        expect(item.roles_anchor).to eq test_parent
        expect(test_collection.can_edit?(user)).to be true
        expect(item.can_edit?(user)).to be true
      end

      context 'with roles anchored to itself' do
        before do
          test_collection.unanchor_and_inherit_roles_from_anchor!
        end

        it 'sets up the anchored roles on the items' do
          expect(test_collection.roles_anchor.id).to eq test_collection.id
          test_collection.reload
          items = test_collection.items
          item = items.first
          expect(items.all? { |i| i.roles_anchor_collection_id == test_collection.id }).to be true
          expect(item.roles_anchor).to eq test_collection
          expect(test_collection.can_edit?(user)).to be true
          expect(item.can_edit?(user)).to be true
        end
      end
    end

    describe '#add_test_tag' do
      it 'should add the #test tag after_create' do
        expect(test_collection.cached_owned_tag_list).to match_array(['feedback'])
      end
    end

    describe '#setup_link_sharing_test_audience' do
      let!(:link_sharing_audience) { create(:audience, price_per_response: 0) }
      let(:test_audience) { test_collection.test_audiences.first }

      it 'should add the test_audience with status of "closed"' do
        expect(test_collection.test_audiences.count).to be 1
        expect(test_audience.status).to eq 'closed'
        expect(test_audience.link_sharing?).to be true
      end

      it 'returns gives_incentive_for test_audience = false' do
        expect(test_collection.gives_incentive_for?(test_audience.id)).to be false
      end
    end
  end

  describe '#create_uniq_survey_response' do
    let!(:test_audience) { create(:test_audience, test_collection: test_collection) }

    it 'should create a survey response with a unique session_uid' do
      expect do
        test_collection.create_uniq_survey_response
      end.to change(test_collection.survey_responses, :count).by(1)
      expect(test_collection.survey_responses.last.session_uid).not_to be nil
    end

    it 'should accept the passed in test_audience_id' do
      expect do
        test_collection.create_uniq_survey_response(test_audience_id: test_audience.id)
      end.to change(test_audience.survey_responses, :count).by(1)
    end
  end

  describe '#duplicate!' do
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
      before do
        expect(test_collection.draft?).to be true
      end

      it 'copies collection' do
        expect do
          duplicate
        end.to change(Collection, :count).by(1)
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
      let(:test_collection) do
        create(:test_collection, :completed, parent_collection: test_parent, roles_anchor_collection_id: test_parent.id)
      end
      let!(:survey_response) do
        create(:survey_response, test_collection: test_collection)
      end

      before do
        test_collection.launch!(initiated_by: user)
        test_collection.reload
        expect(test_collection.live?).to be true
      end

      it 'only copies test design' do
        expect do
          duplicate
        end.to change(Collection, :count).by(1)
        expect(duplicate).to be_instance_of(Collection::TestCollection)
        expect(duplicate.draft?).to be true
      end

      it 'has the right permissions' do
        expect(test_collection.items.all? { |i| i.can_view?(user) }).to be true
        expect(test_collection.items.first.roles_anchor).to eq test_parent
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

      context 'if closed' do
        before do
          test_collection.close!
          expect(test_collection.closed?).to be true
        end

        it 'only copies test design' do
          expect do
            duplicate
          end.to change(Collection, :count).by(1)
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

      context 'if template instance' do
        let(:template) { create(:collection, master_template: true) }
        let(:instance_parent) { create(:collection) }
        let(:test_collection) do
          create(:test_collection,
                 :completed,
                 parent_collection: instance_parent,
                 collection_to_test: instance_parent,
                 template: template)
        end

        it 'sets the duplicate collection_to_test to its own parent' do
          expect(duplicate.collection_to_test).to eq parent_collection
        end
      end
    end
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

  context 'with a ready to launch test' do
    let!(:test_collection) { create(:test_collection, :completed, parent_collection: test_parent) }

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
              .map(&:record)
              .map(&:class),
            ).to eq(
              [
                Item::VideoItem,
                Item::DataItem,
                Item::LegendItem,
                Collection::TestDesign,
              ],
            )
          end

          context 'with more scaled questions' do
            let!(:scale_questions) { create_list(:question_item, 2, parent_collection: test_collection) }
            let(:legend_item) { test_collection.items.legend_items.first }

            it 'should create a LegendItem at the 3rd spot (order == 2)' do
              expect(test_collection.launch!(initiated_by: user)).to be true
              expect(legend_item.parent_collection_card.order).to eq 2
              expect(
                test_collection
                .collection_cards
                .reload
                .map { |card| card.record.class },
              ).to eq(
                [
                  Item::VideoItem,
                  Item::DataItem,
                  Item::LegendItem,
                  Item::DataItem,
                  Item::DataItem,
                  Collection::TestDesign,
                ],
              )
            end
          end

          it 'should update the status to "live"' do
            expect(test_collection.launch!(initiated_by: user)).to be true
            expect(test_collection.live?).to be true
          end

          it 'should create a chart item for each scale question' do
            expect do
              test_collection.launch!(initiated_by: user)
            end.to change(
              Item::DataItem, :count
            ).by(test_collection.question_items.select { |q| q.question_context? || q.question_useful? }.size)
          end

          context 'with test audiences' do
            let(:audience) { create(:audience) }
            let!(:test_audience) { create(:test_audience, audience: audience, test_collection: test_collection, price_per_response: 4.50) }

            it 'should create test audience datasets for each question' do
              expect do
                test_collection.launch!(initiated_by: user)
              end.to change(
                Dataset::Question, :count
              ).by(2)
              expect(Dataset::Question.last.groupings).to eq(
                [{ 'id' => test_audience.id, 'type' => 'TestAudience' }],
              )
            end

            it 'returns gives_incentive_for test_audience = true' do
              expect(test_collection.gives_incentive_for?(test_audience.id)).to be true
            end
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

          context 'with media questions' do
            let!(:test_collection) { create(:test_collection) }

            it 'creates a media item link for each media item' do
              test_collection.launch!(initiated_by: user)
              expect(
                test_collection
                  .items
                  .count,
              ).to equal 4
            end
          end

          context 'with test_audience_params' do
            it 'should call PurchaseTestAudience' do
              params = { some: 'params' }
              expect(PurchaseTestAudience).to receive(:call).with(
                test_collection: test_collection,
                test_audience_params: params,
                user: user,
              )
              test_collection.launch!(initiated_by: user, test_audience_params: params)
            end
          end

          context 'without targeted audience' do
            it 'should not send a notification email' do
              expect(TestCollectionMailer).not_to receive(:notify_launch)
              test_collection.launch!(initiated_by: user)
            end
          end

          context 'with targeted audience' do
            it 'should send a notification email' do
              audience = create(:audience)
              create(:test_audience, audience: audience, test_collection: test_collection, price_per_response: 3.25)

              deliver_double = double('TestCollectionMailer')
              allow(TestCollectionMailer).to receive(:notify_launch).and_return(deliver_double)
              allow(deliver_double).to receive(:deliver_later).and_return(true)

              ENV['ENABLE_ZENDESK_FOR_TEST_LAUNCH'] = '1'

              expect(TestCollectionMailer).to receive(:notify_launch).with(test_collection.id)
              test_collection.launch!(initiated_by: user)
            end
          end

          context 'with media questions' do
            # "completed" will have one video item
            let!(:test_collection) { create(:test_collection, :completed) }
            let(:first_card) { test_collection.collection_cards.first }

            it 'creates a media item link for the media item' do
              test_collection.launch!(initiated_by: user)
              expect(first_card.is_a?(CollectionCard::Link)).to be true
              expect(first_card.item).to eq test_collection.test_design.items.first
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

        it 'should set status as closed and set closed_at datetime' do
          expect(test_collection.close!).to be true
          expect(test_collection.closed?).to be true
          expect(test_collection.test_closed_at).to be_within(1.second).of Time.current
        end
      end

      describe '#test_audience_closed!' do
        before do
          test_collection.launch!(initiated_by: user)
          allow(NotifyFeedbackCompletedWorker).to receive(:perform_async).and_call_original
        end

        context 'with link sharing audience only' do
          let!(:test_audience) { create(:test_audience, :link_sharing, test_collection: test_collection) }

          it 'does not call NotifyFeedbackCompletedWorker' do
            expect(NotifyFeedbackCompletedWorker).not_to receive(:perform_async)
            test_collection.test_audience_closed!
          end

          it 'does not close the test' do
            test_collection.test_audience_closed!
            expect(test_collection.closed?).to be false
          end
        end

        context 'with paid audiences' do
          let!(:test_audience) { create(:test_audience, test_collection: test_collection) }
          let!(:test_audience2) { create(:test_audience, test_collection: test_collection) }

          it 'does not call NotifyFeedbackCompletedWorker until all audiences are complete' do
            expect(NotifyFeedbackCompletedWorker).not_to receive(:perform_async)
            test_audience.closed!
            # now run the check
            test_collection.test_audience_closed!
          end

          it 'calls NotifyFeedbackCompletedWorker when all are complete' do
            expect(NotifyFeedbackCompletedWorker).to receive(:perform_async).with(
              test_collection.id,
            )
            test_audience.closed!
            test_audience2.closed!
            test_collection.test_audience_closed!
          end

          it 'closes the test' do
            test_audience.closed!
            test_collection.test_audience_closed!
            # should not be closed yet...
            expect(test_collection.closed?).to be false
            test_audience2.closed!
            test_collection.test_audience_closed!
            # now the test should be closed after both are complete
            expect(test_collection.closed?).to be true
          end
        end

        context 'with both paid and link sharing audiences' do
          let!(:test_audience) { create(:test_audience, :link_sharing, test_collection: test_collection) }
          let!(:paid_test_audience) { create(:test_audience, status: :closed, test_collection: test_collection) }

          it 'does not close the test, but notifies when the paid audience is closed' do
            expect(NotifyFeedbackCompletedWorker).to receive(:perform_async).with(
              test_collection.id,
            )
            # simulate test_collection getting pinged with last test audience being closed
            test_collection.test_audience_closed!
            # should not be closed yet...
            expect(test_collection.closed?).to be false
          end
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

        it 'should call the post_launch_setup! method on itself with `reopening` param' do
          expect(test_collection).to receive(:post_launch_setup!).with(initiated_by: user, reopening: true)
          test_collection.reopen!(initiated_by: user)
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

  context 'with a submission box template' do
    let(:submission_box) { create(:submission_box) }
    let(:submission_template) { create(:collection, master_template: true, parent_collection: submission_box) }
    let!(:test_collection) do
      create(:test_collection, :completed, master_template: true, parent_collection: submission_template)
    end
    let(:submission) { create(:collection, :submission, parent_collection: submission_box.submissions_collection) }
    let!(:submission_test) { create(:test_collection, :completed, template: test_collection, parent_collection: submission) }

    before do
      submission_box.setup_submissions_collection!
      submission_box.update(submission_template: submission_template)
      # copy cards into the template the way it actually would happen
      test_collection.update_template_instances
    end

    it 'should create the templated questions in the submission_test' do
      expect(submission_test.question_items.count).to eq test_collection.question_items.count
    end

    describe '#launch!' do
      context 'with valid draft collection (default status)' do
        it 'should launch without creating a TestDesign collection' do
          expect(test_collection.launch!(initiated_by: user)).to be true
          expect(test_collection.test_status).to eq 'live'
          expect(test_collection.test_design.present?).to be false
        end

        it 'should call the UpdateTemplateInstancesWorker if there are any instances' do
          expect(test_collection.templated_collections.count).to eq 1
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(test_collection.id)
          test_collection.launch!(initiated_by: user)
        end

        it 'should preserve all of the instance cards' do
          test_collection.launch!(initiated_by: user)
          test_collection.update_template_instances
          # testing a bug case where it was accidentally deleting cards because they weren't pinned
          expect(submission_test.question_items.count).to eq test_collection.question_items.count
        end
      end

      context 'launching submission test' do
        it 'should update the test_status' do
          test_collection.launch!(initiated_by: user)
          submission_test.launch!(initiated_by: user)
          submission.reload
          expect(submission.submission_attrs['test_status']).to eq 'live'
        end
      end
    end

    describe '#update_submissions_launch_status' do
      # gets called from within UpdateTemplateInstancesWorker
      it 'should find all submissions and mark their tests as launchable when launching' do
        # make sure this is now persisted
        submission_test.reload
        test_collection.launch!(initiated_by: user)
        test_collection.update_submissions_launch_status
        submission.reload
        submission_template.reload
        expect(submission_template.submission_attrs).to eq(
          'template' => true,
          'test_status' => 'live',
          'launchable_test_id' => test_collection.id,
        )
        expect(submission.submission_attrs).to eq(
          'submission' => true,
          'test_status' => 'draft',
          'template_test_id' => test_collection.id,
          'launchable_test_id' => submission_test.id,
        )
      end

      it 'should only run if the test itself is live' do
        submission_test.reload
        test_collection.update_submissions_launch_status
        submission.reload
        submission_template.reload
        expect(submission_template.submission_attrs).to eq(nil)
        expect(submission.submission_attrs).to eq(
          'submission' => true,
        )
      end
    end

    describe '#close!' do
      before do
        # persist submissions_collection relations
        submission_test.reload
        submission_box.reload
        test_collection.launch!(initiated_by: user)
        # simulate bg worker
        test_collection.update_submissions_launch_status
        submission_test.launch!(initiated_by: user)
      end

      it 'should find all submissions and close their tests' do
        expect(submission_test.test_status).to eq 'live'
        expect(submission.reload.submission_attrs['test_status']).to eq 'live'

        test_collection.close!

        expect(test_collection.test_closed_at).to be_within(1.second).of Time.current

        submission.reload
        submission_test.reload

        expect(submission.submission_attrs['test_status']).to eq 'closed'
        expect(submission_test.test_status).to eq 'closed'
      end
    end

    describe '#launchable?' do
      it 'should only return true when the master template test has launched' do
        expect(submission_test.launchable?).to be false
        # editor launches the template test for everyone to launch their submissions
        test_collection.launch!
        expect(submission_test.launchable?).to be true
      end

      context 'with multiple tests in the submission template' do
        let!(:test_collection2) do
          create(:test_collection, :completed, master_template: true, parent_collection: submission_template)
        end

        it 'should only return true when no other tests are running' do
          expect(test_collection2.launchable?).to be true
          expect(test_collection.launch!(initiated_by: user)).to be true
          expect(test_collection.test_status).to eq 'live'
          # now that the first test is running, test2 can't be launched
          test_collection2.parent_submission_box_template.reload
          expect(test_collection2.launchable?).to be false
        end
      end
    end

    describe '#update_cached_submission_status' do
      it 'should update the submission test_status accordingly' do
        test_collection.launch!
        expect(submission_test.launch!).to be true
        expect(submission.reload.submission_attrs['test_status']).to eq 'live'
      end
    end
  end

  context 'with an in-collection test' do
    let(:parent_collection) { create(:collection) }
    let!(:live_test_collection) do
      create(:test_collection,
             test_status: :live,
             parent_collection: parent_collection,
             collection_to_test: parent_collection)
    end
    let!(:test_collection) do
      create(:test_collection,
             :completed,
             parent_collection: parent_collection,
             collection_to_test: parent_collection)
    end

    describe '#launchable?' do
      it 'should only return true if there are no other live tests' do
        expect(test_collection.launchable?).to be false
        live_test_collection.close!
        # make sure it picks up the related test now being closed
        parent_collection.reload
        expect(test_collection.launchable?).to be true
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
