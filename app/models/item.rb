class Item < ApplicationRecord
  include Breadcrumbable
  include Resourceable
  include Archivable
  include HasFilestackFile

  resourceable roles: [Role::EDITOR, Role::VIEWER],
               edit_role: Role::EDITOR,
               view_role: Role::VIEWER

  archivable as: :parent_collection_card,
             with: %i[cards_linked_to_this_item]

  acts_as_taggable

  # The card that 'holds' this item and determines its breadcrumb
  has_one :parent_collection_card,
          class_name: 'CollectionCard::Primary',
          inverse_of: :item

  has_many :cards_linked_to_this_item,
           class_name: 'CollectionCard::Link',
           inverse_of: :item

  delegate :parent, to: :parent_collection_card, allow_nil: true
  belongs_to :cloned_from, class_name: 'Item', optional: true

  before_validation :format_url, if: :saved_change_to_url?
  before_create :generate_name, unless: :name?

  validates :type, presence: true

  after_commit :reindex_parent_collection

  amoeba do
    enable
    exclude_association :tags
    exclude_association :taggings
    exclude_association :tag_taggings
    exclude_association :filestack_file
    exclude_association :parent_collection_card
  end

  def started_editing(user, notify: true)
    Cache.set(editing_cache_key, user.id, raw: true)
    publish_to_item_channel if notify
  end

  def stopped_editing(_user, notify: true)
    Cache.delete(editing_cache_key)
    publish_to_item_channel if notify
  end

  def currently_editing_user_as_json
    user_id = Cache.get(editing_cache_key, raw: true)
    return {} if user_id.blank?
    user = User.find(user_id)
    {
      id: user.id,
      name: user.name,
      pic_url_square: user.pic_url_square,
    }
  end

  # Track viewers - using an increment can be prone to dupe issues
  # e.g. same user with two browser windows open
  def started_viewing(user, notify: true)
    Rails.logger.info "Started Viewing #{user.id}"
    Cache.increment(viewing_cache_key)
    publish_to_item_channel if notify
  end

  def stopped_viewing(_user, notify: true)
    Cache.decrement(viewing_cache_key)
    publish_to_item_channel if notify
  end

  def num_viewers
    Cache.get(viewing_cache_key, raw: true).to_i
  end

  def publish_to_item_channel
    Rails.logger.info "Publish to item #{id} channel"
    ActionCable.server.broadcast \
      editing_stream_name,
      {
        editor: currently_editing_user_as_json,
        num_viewers: num_viewers,
      }
  end

  def editing_stream_name
    editing_cache_key
  end

  def editing_cache_key
    "item_#{id}_editing"
  end

  def viewing_cache_key
    "item_#{id}_viewing"
  end

  def children
    []
  end

  def duplicate!(for_user:, copy_parent_card: false)
    # Clones item
    i = amoeba_dup
    i.cloned_from = self
    i.tag_list = tag_list

    # save the dupe item first so that we can reference it later
    # return if it didn't work for whatever reason
    return i unless i.save
    i.parent_collection_card.save if i.parent_collection_card.present?

    # Clone parent + increase order
    if copy_parent_card && parent_collection_card.present?
      i.parent_collection_card = parent_collection_card.duplicate!(
        for_user: for_user,
        shallow: true,
      )
      i.parent_collection_card.item = i
    end

    roles.each do |role|
      i.roles << role.duplicate!(assign_resource: i)
    end

    # Method from HasFilestackFile
    filestack_file_duplicate!(i)

    i.reload
    # Ran into a bug on duplication that parent reindexing failed,
    # So stopping that for now
    i.dont_reindex_parent!
    i
  end

  def breadcrumb_title
    name
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    Item
  end

  def image_url
    # overridden by VideoItem / ImageItem
    nil
  end

  def generate_name
    # overridden by TextItem / ImageItem
    true
  end

  def truncate_name
    self.name = name.truncate(40, separator: /[,?\.\s]+/, omission: '')
  end

  def dont_reindex_parent!
    @dont_reindex_parent = true
  end

  private

  def reindex_parent_collection
    return if @dont_reindex_parent || !Searchkick.callbacks? || parent.blank?
    parent.reindex
  end

  def format_url
    return if url.blank?

    # Remove spaces
    url.strip!
  end
end
