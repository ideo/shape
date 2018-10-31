require 'rails_helper'

RSpec.describe SubmissionBoxTemplateSetter, type: :service do
  let(:user) { create(:user) }
  let(:template_collection) { create(:collection) }
  let(:template) { create(:collection, master_template: true, add_viewers: [user]) }
  let(:template_card) { create(:collection_card_collection, collection: template, width: 2) }
  let(:submission_box) { create(:submission_box, add_editors: [user]) }
  let(:submissions_collection) { create(:submissions_collection, submission_box: submission_box) }
  let(:template_setter) do
    SubmissionBoxTemplateSetter.new(
      submission_box: submission_box,
      template_card: template_card,
      user: user,
    )
  end
  let(:dup_template_card) { template_setter.dup }
  let(:dup_template) { dup_template_card.collection }

  before do
    # Required so the submissions_collection exists on submission_box
    submission_box.reload
    submissions_collection.reload
  end

  describe '#call' do
    it 'should duplicate the template card into the submission box' do
      expect do
        template_setter.call
      end.to change(submission_box.collection_cards, :count).by(1)
    end

    it 'should set the submission box to use the new template' do
      service = template_setter.call
      expect(submission_box.submission_template_id).to eq service.dup.collection.id
      expect(submission_box.submission_box_type).to eq 'template'
    end

    it 'should remove all viewer roles' do
      template_setter.call
      expect(dup_template.viewers[:users].count).to eq 0
    end

    it 'should name the new template with the submission box' do
      template_setter.call
      expect(dup_template.name).to eq "#{submission_box.name} #{template_card.collection.name}"
    end

    it 'should set the duplicate template card size to 1x1' do
      template_setter.call
      expect(dup_template_card.width).to eq 1
      expect(dup_template_card.height).to eq 1
    end

    it 'should add a special tag to the submission box' do
      template_setter.call
      expect(dup_template.reload.cached_owned_tag_list).to include('submission-template')
    end

    context 'with existing submissions' do
      let(:existing_submission_collection) { create(:collection, name: 'Ms new submission') }
      let(:existing_submission) do
        create(:collection_card_collection,
               collection: existing_submission_collection,
               parent: submissions_collection)
      end

      before do
        existing_submission.parent.reload
      end

      it 'should rename any existing submissions with inactive prefix' do
        template_setter.call
        expect(existing_submission.collection.reload.name).to eq '[Inactive] Ms new submission'
      end
    end

    context 'with previous used and unused templates' do
      let(:template1) { create(:collection, master_template: true, add_viewers: [user]) }
      let(:template_card1) { create(:collection_card_collection, collection: template1) }

      let(:another_setter) do
        SubmissionBoxTemplateSetter.new(
          submission_box: submission_box,
          template_card: template_card1,
          user: user,
        )
      end
      let(:previous_used_template) { template_setter.dup.collection }
      let(:previous_unused_template) { another_setter.dup }

      let(:existing_submission) { create(:collection, template: previous_used_template) }
      let(:existing_submission_card) { create(:collection_card_collection, parent: submissions_collection) }

      before do
        another_setter.call
        template_setter.call
      end

      it 'should delete any unused previous templates' do
        expect(submission_box.collections.include?(previous_unused_template)).to be false
      end

      it 'should not delete templates that have been submitted with' do
        expect(submission_box.collections.include?(previous_used_template)).to be true
      end
    end
  end
end
