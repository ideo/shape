module Archivable
  extend ActiveSupport::Concern
  extend ActiveModel::Callbacks

  included do
    define_model_callbacks :archive, :unarchive, only: %i[after]

    scope :archived, -> { where(archived: true) }
    scope :active, -> { where(archived: false) }

    class_attribute :archive_with
    class_attribute :archive_as
  end

  class_methods do
    # define which relations should get archived (much like dependent: :destroy)
    def archivable(as: nil, with: [])
      self.archive_as = as
      self.archive_with = with
    end

    # Helpers to add archived field to any model
    #
    # e.g. in a migration:
    # def up; Item.add_archived_column!; end

    def add_archived_column!
      connection.add_column table_name, :archived, :boolean, default: false
    end

    def add_archived_info_columns!
      connection.add_column table_name, :archived_at, :datetime
      connection.add_column table_name, :archive_batch, :string, index: true
    end

    def remove_archived_column!
      connection.remove_column table_name, :archived
    end

    def remove_archived_info_columns!
      connection.remove_column table_name, :archived_at
      connection.remove_column table_name, :archived_batch
    end
  end

  def active?
    !archived
  end

  def archive_as_object
    self.class.archive_as.present? && try(self.class.archive_as)
  end

  def archive!
    return true if archived?
    # make sure the `archive_as` relation object is actually present
    if archive_as_object.present?
      # treat this archive! as if you had triggered it on the parent
      # e.g. by archiving a Collection we should really be archiving its parent card
      return archive_as_object.try(:archive!)
    end
    run_callbacks :archive do
      archive_with_relations!(batch: "#{self.class}_#{id}")
    end
  end

  def unarchive!
    return true if active?
    # currently just configured for Card/Item/Collection
    return if is_a? Group
    # make sure the `archive_as` relation object is actually present
    if archive_as_object.present?
      return archive_as_object.try(:unarchive!)
    end
    run_callbacks :unarchive do
      unarchive_batch!
      true
    end
  end

  # will first archive all of the `archive_with` relations, and then archive the model itself
  def archive_with_relations!(batch:)
    archive_relations!(batch)
    archive_self!(batch)
  end

  def unarchive_batch!
    # unarchive all Cards/Items/Collections that match this archive_batch
    [CollectionCard, Collection, Item].each do |model|
      model
        .where(archive_batch: archive_batch)
        .update_all(archived: false, archived_at: nil, archive_batch: nil)
    end
  end

  private

  def archived_on_previous_save?
    saved_change_to_archived? && archived?
  end

  def archive_relations!(batch)
    return unless self.class.archive_with.present?
    self.class.archive_with.each do |relation|
      related = try(relation)
      if related.is_a? ActiveRecord::Relation
        # use .map if relation is one-to-many (e.g. collection_cards)
        related.map { |r| r.try(:archive_with_relations!, batch: batch) }
      else
        # otherwise just archive the relation (e.g. item)
        related.try(:archive_with_relations!, batch: batch)
      end
    end
  end

  def archive_self!(batch)
    update(archived: true, archived_at: Time.now, archive_batch: batch)
  end

  def unarchive_self!
    update(archived: false, archived_at: nil, archive_batch: nil)
  end
end
