class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection'
end
