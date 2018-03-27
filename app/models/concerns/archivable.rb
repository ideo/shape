module Archivable
  extend ActiveSupport::Concern

  included do
    scope :archived, -> { where(archived: true) }
    scope :active, -> { where(archived: false) }

    class_attribute :archive_with
    class_attribute :archive_as
    class_attribute :after_archive
  end

  class_methods do
    # define which relations should get archived (much like dependent: :destroy)
    def archivable(as: nil, with: [], after_archive: nil)
      self.archive_as = as
      self.archive_with = with
      self.after_archive = after_archive
    end

    # Helpers to add archived field to any model
    #
    # e.g. in a migration:
    # def up; Item.add_archived_column!; end

    def add_archived_column!
      connection.add_column table_name, :archived, :boolean, default: false
    end

    def remove_archived_column!
      connection.remove_column table_name, :archived
    end
  end

  def active?
    !archived
  end

  def archive!
    return true if archived?
    if self.class.archive_as.present?
      # treat this archive! as if you had triggered it on the parent
      # e.g. by archiving a Collection we should really be archiving its parent card
      return try(self.class.archive_as).try(:archive_with_relations!)
    end
    archive_with_relations!
  end

  # will archive the card as well as its `archive_with` and calling `after_archive`
  def archive_with_relations!
    if self.class.archive_with.present?
      self.class.archive_with.each do |relation|
        related = try(relation)
        if related.is_a? ActiveRecord::Relation
          # use .map if relation is one-to-many (e.g. collection_cards)
          related.map { |r| r.try(:archive_with_relations!) }
        else
          # otherwise just archive the relation (e.g. item)
          related.try(:archive_with_relations!)
        end
      end
    end
    # then update self
    update(archived: true)
    try(self.class.after_archive) if self.class.after_archive
  end
end
