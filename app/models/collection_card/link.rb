# == Schema Information
#
# Table name: collection_cards
#
#  id                :bigint(8)        not null, primary key
#  archive_batch     :string
#  archived          :boolean          default(FALSE)
#  archived_at       :datetime
#  col               :integer
#  filter            :integer          default("transparent_gray")
#  font_background   :boolean          default(FALSE)
#  font_color        :string
#  height            :integer          default(1)
#  hidden            :boolean          default(FALSE)
#  identifier        :string
#  image_contain     :boolean          default(FALSE)
#  is_background     :boolean          default(FALSE)
#  is_cover          :boolean          default(FALSE)
#  order             :integer
#  parent_snapshot   :jsonb
#  pinned            :boolean          default(FALSE)
#  row               :integer
#  section_type      :integer
#  show_replace      :boolean          default(TRUE)
#  type              :string
#  unarchived_at     :datetime
#  width             :integer          default(1)
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  collection_id     :bigint(8)
#  item_id           :bigint(8)
#  parent_id         :bigint(8)
#  templated_from_id :integer
#
# Indexes
#
#  index_collection_cards_on_archive_batch             (archive_batch)
#  index_collection_cards_on_collection_id             (collection_id)
#  index_collection_cards_on_identifier_and_parent_id  (identifier,parent_id)
#  index_collection_cards_on_item_id                   (item_id)
#  index_collection_cards_on_order_and_row_and_col     (order,row,col)
#  index_collection_cards_on_parent_id                 (parent_id)
#  index_collection_cards_on_templated_from_id         (templated_from_id)
#  index_collection_cards_on_type                      (type)
#

class CollectionCard
  class Link < CollectionCard
    archivable
    after_archive :after_archive_card
    after_unarchive :after_unarchive_card

    belongs_to :collection,
               optional: true,
               inverse_of: :cards_linked_to_this_collection
    belongs_to :item,
               optional: true,
               inverse_of: :cards_linked_to_this_item

    def can_edit?(user_or_group)
      # you can edit (meaning remove) a link card as long as you can content edit the parent collection
      parent.can_edit_content?(user_or_group)
    end
  end
end
