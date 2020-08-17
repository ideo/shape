require 'rails_helper'

describe Collection::TestCollection, type: :model, seed: true do
  let(:user) { create(:user) }
  let(:test_parent) { create(:collection, add_editors: [user]) }
  let(:test_collection) do
    create(:test_collection, parent_collection: test_parent, roles_anchor_collection: test_parent)
  end
  let(:num_default_question_items) do
    Collection::TestCollection.default_question_types_by_section.values.flatten.size
  end

  context 'associations' do
    it { should have_many :survey_responses }
    it { should have_many :question_items }
    it { should have_many :test_audiences }
    it { should have_one :test_results_collection }
    it { should belong_to :collection_to_test }
  end

  context 'callbacks' do
    describe '#setup_default_status_and_questions' do
      let(:sections_and_card_types) do
        test_collection.collection_cards.each_with_object({}) do |collection_card, h|
          h[collection_card.section_type.to_sym] ||= []
          h[collection_card.section_type.to_sym] << collection_card.card_question_type.to_sym
        end
      end

      it 'should set the test_status to "draft"' do
        expect(test_collection.test_status).to eq 'draft'
      end

      it 'should create the default setup with its attached cards and items' do
        expect(test_collection.collection_cards.count).to eq(num_default_question_items)
        expect(test_collection.items.count).to eq(num_default_question_items - 1)
        expect(test_collection.collections.count).to eq(1)

        expect(
          sections_and_card_types,
        ).to eq(
          Collection::TestCollection.default_question_types_by_section,
        )
      end

      it 'creates the ideas collection with a single question_idea card' do
        ideas_coll_card = test_collection.collection_cards.ideas_collection_card.first
        ideas_collection = ideas_coll_card.collection
        expect(ideas_collection).to be_a(Collection)
        expect(ideas_collection.items.pluck(:question_type)).to eq(['question_idea'])
      end

      it 'sets up the anchored roles on the items and colletion' do
        expect(test_collection.roles_anchor_collection_id).to eq test_parent.id
        test_collection.reload
        records = test_collection.items + test_collection.collections
        record = records.sample
        expect(records.all? { |i| i.roles_anchor_collection_id == test_parent.id }).to be true
        expect(record.roles_anchor).to eq test_parent
        expect(test_collection.can_edit?(user)).to be true
        expect(record.can_edit?(user)).to be true
      end

      context 'with roles anchored to itself' do
        before do
          test_collection.unanchor_and_inherit_roles_from_anchor!
        end

        it 'sets up the anchored roles on the items and collection' do
          expect(test_collection.roles_anchor.id).to eq test_collection.id
          test_collection.reload
          records = test_collection.items + test_collection.collections
          record = records.sample
          expect(records.all? { |i| i.roles_anchor_collection_id == test_collection.id }).to be true
          expect(record.roles_anchor).to eq test_collection
          expect(test_collection.can_edit?(user)).to be true
          expect(record.can_edit?(user)).to be true
        end
      end

      describe '#update_ideas_collection' do
        let(:test_collection) do
          create(:test_collection, :completed, parent_collection: test_parent, roles_anchor_collection: test_parent)
        end
        let(:ideas_collection) { test_collection.ideas_collection }

        it 'should update the ideas collection to match test_show_media setting' do
          expect(test_collection.test_show_media).to be true
          expect(ideas_collection.test_show_media).to be true
          expect {
            test_collection.update(test_show_media: false)
            ideas_collection.reload
          }.to change(ideas_collection, :test_show_media)
          expect(ideas_collection.test_show_media).to be false
        end
      end
    end

    describe '#add_test_tag' do
      it 'should add the #test tag after_create' do
        expect(test_collection.cached_owned_tag_list).to match_array(['feedback'])
      end
    end

    describe '#setup_link_sharing_test_audience' do
      let!(:link_sharing_audience) { create(:audience, min_price_per_response: 0) }
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

    context 'challenge test audiences' do
      let!(:challenge_test_audience) { create(:audience, min_price_per_response: 0, audience_type: :challenge) }
      let(:template) { create(:collection, :challenge, master_template: true) }
      let!(:test_collection) { create(:test_collection, parent_collection: template) }
      let!(:admin_audience) { Audience.find_by(name: 'Admins') }
      let!(:reviewer_audience) { Audience.find_by(name: 'Reviewers') }
      let!(:participant_audience) { Audience.find_by(name: 'Participants') }
      let(:reviewer_test_audience) do
        test_collection.challenge_audiences.find { |ca| ca.audience.name == 'Reviewers' }
      end
      let(:admin_test_audience) do
        test_collection.challenge_audiences.find { |ca| ca.audience.name == 'Admins' }
      end

      describe '#setup_challenge_test_audiences' do
        it 'should add the test_audiences' do
          expect(test_collection.challenge_audiences.any?).to be(true)
          audiences = test_collection.challenge_audiences.map(&:audience)
          expect(audiences).to include(admin_audience)
          expect(audiences).to include(reviewer_audience)
          expect(audiences).to include(participant_audience)
        end

        it 'should set Reviewer test audience to open' do
          expect(reviewer_test_audience.open?).to be(true)
        end
      end

      describe '#challenge_test_audience_for_user' do
        it 'should find the first relevant audience for the user' do
          user.add_role(Role::MEMBER, template.challenge_reviewer_group)
          expect(test_collection.challenge_test_audience_for_user(user)).to eq reviewer_test_audience
        end

        it 'should find the admin audience for the user before any others' do
          user.add_role(Role::MEMBER, template.challenge_reviewer_group)
          user.add_role(Role::MEMBER, template.challenge_admin_group)
          admin_test_audience.update(status: :open)
          expect(test_collection.challenge_test_audience_for_user(user)).to eq admin_test_audience
        end

        it 'should not find any if the user is not in one of the groups' do
          expect(test_collection.challenge_test_audience_for_user(user)).to be nil
        end
      end
    end

    describe '#archive_idea_questions' do
      let(:collection_to_test) { create(:collection) }

      it 'archives idea cards if collection to test added' do
        idea_cards = test_collection.idea_items.map(&:parent_collection_card)
        non_idea_cards = test_collection.collection_cards
        expect(idea_cards.all?(&:archived?)).to be false
        test_collection.update(collection_to_test: collection_to_test)
        idea_cards.each(&:reload)
        non_idea_cards.each(&:reload)
        expect(idea_cards.all?(&:archived?)).to be true
        expect(non_idea_cards.all?(&:archived?)).to be false
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
      # Run background jobs to clone cards
      Sidekiq::Testing.inline! do
        test_collection.duplicate!(
          for_user: user,
          copy_parent_card: false,
          parent: parent_collection,
        )
      end
    end

    before do
      user.add_role(Role::EDITOR, parent_collection)
      user.add_role(Role::EDITOR, test_collection)
      test_collection.children.each do |record|
        user.add_role(Role::EDITOR, record)
      end
    end

    context 'if in draft status' do
      before do
        expect(test_collection.draft?).to be true
      end

      it 'copies collection and sub-collection' do
        expect do
          duplicate
        end.to change(Collection, :count).by(2)
        expect(duplicate).to be_instance_of(Collection::TestCollection)
        expect(duplicate.draft?).to be true
      end

      it 'has question items' do
        expect(
          duplicate.question_items.pluck(:question_type),
        ).to match_array(
          test_collection.question_items.pluck(:question_type),
        )
      end

      it 'has ideas collection' do
        expect(duplicate.ideas_collection).not_to be_nil
        expect(
          duplicate.ideas_collection.items.map(&:question_type),
        ).to eq(
          test_collection.ideas_collection.items.pluck(:question_type),
        )
      end

      it 'renames it to Copy of {name}' do
        expect(duplicate.name).to eq("Copy of #{test_collection.name}")
      end
    end

    context 'if live' do
      let(:test_collection) do
        create(:test_collection, :launched, parent_collection: test_parent, roles_anchor_collection_id: test_parent.id)
      end
      let!(:test_audience) { create(:test_audience, :link_sharing, test_collection: test_collection, launched_by: user) }
      let!(:survey_response) do
        create(:survey_response, test_collection: test_collection)
      end

      it 'always reset its test status to draft' do
        expect do
          duplicate
        end.to change(Collection, :count).by(2)
        expect(duplicate).to be_instance_of(Collection::TestCollection)
        expect(duplicate.draft?).to be true
      end

      it 'has the right permissions' do
        expect(test_collection.items.all? { |i| i.can_view?(user) }).to be true
        expect(test_collection.items.first.roles_anchor).to eq test_parent
      end

      it 'has question items' do
        expect(
          duplicate.question_items.pluck(:question_type),
        ).to match_array(
          test_collection.question_items.pluck(:question_type),
        )
      end

      it 'has ideas collection' do
        expect(duplicate.ideas_collection).not_to be_nil
        expect(
          duplicate.ideas_collection.items.map(&:question_type),
        ).to eq(
          test_collection.ideas_collection.items.pluck(:question_type),
        )
      end

      it 'does not have any responses' do
        expect(duplicate.survey_responses.count).to eq(0)
      end

      it 'renames it to Copy of {name}' do
        duplicate_name = "Copy of #{test_collection.name}"
                         .gsub(Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX, '')
        expect(duplicate.name).to eq(duplicate_name)
      end

      it 'no longer has a test_collection' do
        expect(duplicate.test_collection_id).to be_nil
      end

      context 'if closed' do
        before do
          test_collection.close!
          expect(test_collection.closed?).to be true
        end

        it 'only copies test design + ideas collection' do
          expect do
            duplicate
          end.to change(Collection, :count).by(2)
          expect(duplicate).to be_instance_of(Collection::TestCollection)
          expect(duplicate.draft?).to be true
        end

        it 'has question items' do
          expect(
            duplicate.question_items.pluck(:question_type),
          ).to match_array(
            test_collection.question_items.pluck(:question_type),
          )
        end

        it 'does not have any responses' do
          expect(duplicate.survey_responses.count).to eq(0)
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

  context 'if template instance inside a submission' do
    let(:template) { create(:test_collection, master_template: true) }
    let(:parent_collection) { create(:collection, :submission) }
    let!(:test_template_instance) do
      create(:test_collection,
             :completed,
             parent_collection: parent_collection,
             collection_to_test: parent_collection,
             template: template)
    end

    it 'is launchable if the template is live' do
      allow(template).to receive(:live?).and_return(true)
      expect(test_template_instance.launchable?).to eq(true)
    end

    it 'is not launchable if the template is live' do
      allow(template).to receive(:live?).and_return(false)
      expect(test_template_instance.launchable?).to eq(false)
    end
  end

  context 'with a ready to launch test' do
    let!(:test_collection) { create(:test_collection, :completed, parent_collection: test_parent) }

    context 'launching a test' do
      describe '#launch!' do
        context 'with valid draft collection (default status)' do
          it 'should create a TestResults collection and move itself into it' do
            expect(test_collection.test_results_collection.present?).to be false
            expect(TestResultsCollection::CreateCollection).to receive(:call).and_call_original
            # call launch!
            expect(test_collection.launch!(initiated_by: user)).to be true
            test_results_collection = test_collection.test_results_collection
            expect(test_results_collection.present?).to be true
            expect(test_results_collection.created_by).to eq user
            # should have moved itself into the TRC
          end

          it 'should update the status to "live"' do
            expect(test_collection.launch!(initiated_by: user)).to be true
            expect(test_collection.live?).to be true
          end

          context 'with test audiences' do
            let(:audience) { create(:audience) }
            let!(:test_audience) { create(:test_audience, audience: audience, test_collection: test_collection, price_per_response: 4.50) }

            it 'should create test audience datasets for each question' do
              scale_question_num = test_collection.question_items.scale_questions.count
              # All scale questions get test dataset, idea(s) datasets, test_audience dataset, test_audience + idea dataset
              # since there is also link sharing, there are 2 more test_audience, test_audience + idea for a total of 6x
              dataset_count = scale_question_num * 6
              expect do
                Sidekiq::Testing.inline! do
                  test_collection.launch!(initiated_by: user)
                end
              end.to change(
                Dataset::Question, :count
              ).by(dataset_count)
              data_groupings = test_collection
                               .test_results_collection
                               .data_items
                               .map(&:datasets)
                               .flatten
                               .map(&:groupings)
              expect(data_groupings).to include(
                ['id' => test_audience.id, 'type' => 'TestAudience'],
              )
            end

            it 'returns gives_incentive_for test_audience = true' do
              expect(test_collection.gives_incentive_for?(test_audience.id)).to be true
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

          describe '#serialized_for_test_survey' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'should output its collection_cards as question cards' do
              data = test_collection.serialized_for_test_survey
              question_cards = TestCollectionCardsForSurvey.call(test_collection)
              card_ids = question_cards.map(&:id_with_idea_id).map(&:to_s)
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
            expect(test_collection.errors).to match_array(
              ["You can't launch because the feedback is live"],
            )
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

          before do
            # first remove the link sharing audience
            test_collection.test_audiences.where(price_per_response: 0).destroy_all
          end

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
    end
  end

  context 'with a submission box template' do
    let(:submission_box) { create(:submission_box) }
    let(:submission_template) { create(:collection, master_template: true, parent_collection: submission_box) }
    let!(:test_collection) do
      create(:test_collection, :completed, master_template: true, parent_collection: submission_template)
    end
    let(:submission) { create(:collection, :submission, parent_collection: submission_box.submissions_collection) }
    let(:submission_test) { create(:test_collection, :completed, template: test_collection, parent_collection: submission) }
    let(:test_collection_template_updater) {
      TemplateInstanceUpdater.new(
        master_template: test_collection,
        updated_card_ids: test_collection.collection_cards.pluck(:id),
        template_update_action: :create,
      )
    }
    let(:submission_template_updater) {
      TemplateInstanceUpdater.new(
        master_template: submission_template,
        updated_card_ids: submission_template.collection_cards.pluck(:id),
        template_update_action: :create,
      )
    }

    before do
      submission_box.setup_submissions_collection!
      submission_box.update(submission_template: submission_template)
      # persist this now that submissions_collection exists
      submission_test
      # copy cards into the template the way it actually would happen
      test_collection_template_updater.call
    end

    it 'should create the templated questions in the submission_test' do
      expect(submission_test.question_items.count).to eq test_collection.question_items.count
    end

    describe '#launch!' do
      context 'with valid draft collection (default status)' do
        it 'should launch without creating a TestResults collection' do
          expect(test_collection.launch!(initiated_by: user)).to be true
          expect(test_collection.test_status).to eq 'live'
          expect(test_collection.test_results_collection.present?).to be false
        end

        it 'should call the UpdateTemplateInstancesWorker if there are any instances' do
          expect(test_collection.templated_collections.count).to eq 1
          expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
            test_collection.id,
            test_collection.collection_cards.pluck(:id),
            :update_all,
          )
          test_collection.launch!(initiated_by: user)
        end

        it 'should preserve all of the instance cards' do
          test_collection.launch!(initiated_by: user)
          submission_template_updater.call
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

    describe '#hide_or_show_section_questions!' do
      context 'when its a in collection test' do
        before do
          test_collection.collection_to_test_id = 1
          test_collection.hide_or_show_section_questions!
        end

        it 'should hide intro/outro questions' do
          cards = test_collection
                  .question_cards_from_sections(%i[intro outro])
                  .includes(:item)
                  .reject { |card| card.item.question_finish? }
          expect(cards.pluck(:hidden)).to all(be true)
        end

        it 'should hide idea colleciton' do
          card = test_collection.primary_collection_cards.ideas_collection_card.first
          expect(card.hidden).to be true
        end
      end

      context 'when its a idea test' do
        before do
          test_collection.collection_to_test_id = nil
          test_collection.hide_or_show_section_questions!
        end

        it 'should unhide intro/outro questions' do
          cards = test_collection.question_cards_from_sections(%i[intro outro])
          expect(cards.pluck(:hidden)).to all(be false)
        end

        it 'should hide idea colleciton' do
          card = test_collection.primary_collection_cards.ideas_collection_card.first
          expect(card.hidden).to be false
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
          'launchable_test_collection_to_test_id' => test_collection.collection_to_test_id,
        )
        expect(submission.submission_attrs).to eq(
          'submission' => true,
          'test_status' => 'draft',
          'template_test_id' => test_collection.id,
          'launchable_test_id' => submission_test.id,
          'launchable_test_collection_to_test_id' => submission_test.collection_to_test_id,
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

    describe '#queue_update_live_test' do
      let(:test_collection) { create(:test_collection, :launched) }
      let(:card) { test_collection.collection_cards.last }

      it 'should call the CreateContentWorker if the test is live' do
        expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
          test_collection.test_results_collection.id,
          nil,
          card.id,
        )
        test_collection.queue_update_live_test(card.id)
      end

      it 'return early if the test is not live' do
        test_collection.close!
        expect(TestResultsCollection::CreateContentWorker).not_to receive(:perform_async)
        test_collection.queue_update_live_test(card.id)
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
             :launched,
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
      # binding.pry
      expect(test_collection.launch!(initiated_by: user)).to be false
      expect(test_collection.errors).to match_array([
        'Please add your content to idea 1',
        'Please add your category to question 1',
        'Please add your open response to question 6',
        'Please add your open response to question 7',
        'Question items are invalid',
      ])
    end
  end
end
