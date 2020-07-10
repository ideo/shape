require 'rails_helper'

describe Collection::SubmissionBox, type: :model do
  context 'associations' do
    it { should belong_to :submission_template }
    it { should have_one :submissions_collection }
  end

  context 'validations' do
    let(:submission_box) { create(:submission_box) }

    it 'should reject submission_template if not a master_template' do
      submission_box.update(submission_template: create(:collection))
      expect(
        submission_box.errors[:submission_template],
      ).to include('must be a Master Template')
    end

    it 'should validate submission_template is a master_template' do
      expect(
        submission_box.update(submission_template: create(:collection, master_template: true)),
      ).to be true
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let(:group) { create(:group) }
    let(:parent_collection) { create(:collection, add_editors: [user]) }
    # duplicate! method expects a parent_collection to be present
    let(:submission_box) { create(:submission_box, parent_collection: parent_collection) }
    let(:duplicate) do
      submission_box.duplicate!(for_user: user, synchronous: true)
    end
    let(:submissions_collection) { duplicate.submissions_collection }

    before do
      submission_box.setup_submissions_collection!
    end

    it 'should also create its own submissions_collection' do
      expect(submission_box.submissions_collection.present?).to be true
      expect(duplicate.submissions_collection.present?).to be true
      expect(duplicate.submissions_collection).not_to eq submission_box.submissions_collection
    end

    it 'should update the submissions_collection roles_anchor when assigning a role' do
      expect(duplicate.roles_anchor).to eq parent_collection
      expect(submissions_collection.roles_anchor).to eq parent_collection
      Roles::MassAssign.call(
        object: duplicate,
        role_name: Role::EDITOR,
        groups: [group],
        propagate_to_children: true,
        synchronous: true,
      )
      expect(duplicate.roles_anchor).to eq duplicate
      expect(submissions_collection.reload.roles_anchor).to eq duplicate
    end

    context 'with a template' do
      let!(:template_card) { create(:collection_card, parent: parent_collection) }
      let!(:template) { create(:collection, master_template: true, parent_collection_card: template_card) }

      before do
        SubmissionBoxTemplateSetter.call(
          submission_box: submission_box,
          template_card: template_card,
          submission_box_type: :template,
          user: user,
        )
      end

      it 'should create its own template' do
        expect(submission_box.submission_template.cloned_from).to eq template
        expect(duplicate.submission_template).not_to eq submission_box.submission_template
        expect(duplicate.submission_template.cloned_from).to eq submission_box.submission_template
      end
    end
  end

  describe '#archive' do
    let(:submission_box) { create(:submission_box) }

    before do
      submission_box.setup_submissions_collection!
    end

    it 'should also archive the submissions_collection' do
      expect(submission_box.archived?).to be false
      expect(submission_box.submissions_collection.archived?).to be false
      submission_box.archive!
      expect(submission_box.archived?).to be true
      expect(submission_box.submissions_collection.archived?).to be true
    end
  end

  describe '#available_submission_tests' do
    let(:user) { create(:user) }
    let(:user2) { create(:user) }
    let(:organization) { create(:organization) }
    let(:submission_template) { create(:collection, master_template: true) }
    let(:template_test) { create(:test_collection, parent_collection: submission_template) }
    let(:submission_box) do
      create(:submission_box, organization: organization, submission_box_type: :template, submission_template: submission_template)
    end
    let(:submissions_collection) { submission_box.submissions_collection }
    let(:submission) do
      create(:collection, :submission, parent_collection: submissions_collection, organization: organization)
    end
    let(:submission_test) do
      create(
        :test_collection,
        test_status: :live,
        parent_collection: submission,
        organization: organization,
        add_viewers: [organization.primary_group],
      )
    end
    let(:submission2) do
      create(:collection, :submission, parent_collection: submissions_collection, organization: organization)
    end
    let(:submission_test2) do
      create(
        :test_collection,
        test_status: :live,
        parent_collection: submission2,
        organization: organization,
        add_viewers: [user2],
      )
    end

    before do
      submission_box.setup_submissions_collection
      # the master template has to have launched
      submission_template.update(submission_attrs: { template: true, launchable_test_id: template_test.id, test_status: 'live' })
      submission.update(submission_attrs: { submission: true, launchable_test_id: submission_test.id })
      submission2.update(submission_attrs: { submission: true, launchable_test_id: submission_test2.id })
      user.add_role(Role::MEMBER, organization.primary_group)
      user2.add_role(Role::MEMBER, organization.primary_group)
    end

    context 'with a collection_to_test' do
      let!(:collection_to_test) { create(:collection) }
      let(:template_test) do
        create(:test_collection, parent_collection: submission_template, collection_to_test: collection_to_test)
      end

      it 'should find any tests that you have view access to' do
        expect(submission_box.available_submission_tests(for_user: user))
          .to match_array([submission_test])
        expect(submission_box.available_submission_tests(for_user: user2))
          .to match_array([submission_test, submission_test2])
      end

      context 'with survey_responses' do
        let!(:survey_response) do
          create(:survey_response, status: :completed, test_collection: submission_test, user: user)
        end

        it 'should find any tests that you have not completed' do
          expect(submission_box.available_submission_tests(for_user: user))
            .to match_array([])
        end
      end

      describe '#random_next_submission_test' do
        it 'should find one of the tests you have access to' do
          # only one available, so not "random", but just checking that the function works
          expect(submission_box.random_next_submission_test(for_user: user).first)
            .to eq(submission_test)
        end
      end
    end

    context 'with standalone tests' do
      it 'should find any tests regardless of view access' do
        expect(submission_box.available_submission_tests(for_user: user))
          .to match_array([submission_test, submission_test2])
        # simulate case where current_user is nil e.g. anonymous public testing
        expect(submission_box.available_submission_tests(for_user: nil))
          .to match_array([submission_test, submission_test2])
      end
    end
  end
end
