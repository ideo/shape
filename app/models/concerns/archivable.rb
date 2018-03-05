module Archivable
  extend ActiveSupport::Concern

  included do
    scope :archived, -> { where(archived: true) }
    scope :active, -> { where(archived: false) }
    default_scope -> { active }
  end

  class_methods do
    # define which relations should get archived (much like dependent: :destroy)
    attr_reader :archive_with
    attr_reader :archive_as

    def archivable(as: nil, with: [])
      @archive_as = as
      @archive_with = with
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
    elsif self.class.archive_with.present?
      archive_with_relations!
    end
  end

  # will archive the card as well as its @archive_with
  def archive_with_relations!
    if self.class.archive_with.present?
      self.class.archive_with.each do |relation|
        related = try(relation)
        # use .map if relation is one-to-many
        if related.is_a? ActiveRecord::Relation
          related.map { |r| r.try(:archive_with_relations!) }
        else
          related.try(:archive_with_relations!)
        end
      end
    end
    # then update self
    update(archived: true)
  end
end
