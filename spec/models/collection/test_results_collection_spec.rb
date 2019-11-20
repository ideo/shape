require 'rails_helper'

describe Collection::TestResultsCollection, type: :model do
  let(:user) { create(:user) }
  let!(:parent_collection) { create(:collection) }
  let!(:test_collection) { create(:test_collection, :completed, parent_collection: parent_collection) }
  let(:launch) do
    test_collection.reload
    test_collection.launch!(initiated_by: create(:user))
    test_collection.test_results_collection.reload
  end
  let(:test_results_collection) { test_collection.test_results_collection }

  context 'associations' do
    it { should belong_to :test_collection }
  end

  describe '#duplicate!' do
    let(:duplicate) do
      test_results_collection.duplicate!(
        for_user: user,
        copy_parent_card: false,
        parent: parent_collection,
      )
    end
    before do
      launch
      network_mailing_list_doubles
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

    it 'turns it back into a Collection::TestCollection' do
      expect(duplicate).to be_instance_of(Collection::TestCollection)
    end

    it 'has copies of the question items' do
      test_collection.reload
      expect(
        duplicate.question_items.pluck(:question_type),
      ).to match_array(
        test_collection.question_items.pluck(:question_type),
      )
      expect(
        duplicate.question_items.pluck(:cloned_from_id),
      ).to match_array(
        test_collection.question_items.pluck(:id),
      )
    end
  end
end
