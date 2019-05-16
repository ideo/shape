require 'rails_helper'

RSpec.describe Dataset::OrgWideQuestion, type: :model do
  describe '.find_or_create_for_organization' do
    let(:organization) { create(:organization) }
    let(:scale_question_types) do
      Item::QuestionItem.question_type_categories[:scaled_rating]
    end

    it 'creates datasets for all scale question types' do
      expect(organization.org_wide_question_datasets.count).to eq(0)

      expect {
        subject.find_or_create_for_organization(organization)
      }.to change(Dataset::OrgWideQuestion, :count).by(scale_question_types.size)

      expect(organization.org_wide_question_datasets.count).to eq(scale_question_types.size)
    end
  end
end
