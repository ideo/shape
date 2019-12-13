# == Schema Information
#
# Table name: collection_filters
#
#  id            :bigint(8)        not null, primary key
#  filter_type   :integer
#  text          :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  collection_id :bigint(8)
#
# Indexes
#
#  index_collection_filters_on_collection_id  (collection_id)
#

class CollectionFilter < ApplicationRecord
  belongs_to :collection
  has_many :user_collection_filters,
           dependent: :destroy

  validates :text, presence: true

  enum filter_type: {
    tag: 0,
    search: 1,
  }

  amoeba do
    enable
    recognize []
    propagate
  end

  def duplicate!(assign_collection: collection)
    cf = amoeba_dup
    cf.collection = assign_collection
    if search? && within_collection_id.present?
      # Change within filter to link to correct collection
      # if that collection has been duplicated

      # TODO: how do we find a collection that was cloned in this same batch
      # from that collection? There will be many copies of "All Methods"
      cloned_collection = Collection.where(cloned_from_id: within_collection_id).first
      if cloned_collection.present?
        cf.text.sub!(
          %r{within\(#{Organization::SLUG_SUBSTR}\/#{within_collection_id}\)},
          "within(#{cloned_collection.organization.slug}/#{cloned_collection.id})",
        )
      end
    end
    cf.save
    cf
  end

  def within_collection_id
    return if !search? || text.blank?

    Search::Filters::WithinCollection.new(text).within_collection_id
  end
end
