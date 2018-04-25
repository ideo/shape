module Archivable
  extend ActiveSupport::Concern
  extend ActiveModel::Callbacks

  included do
    define_model_callbacks :archive, only: %i[after]

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

    def remove_archived_column!
      connection.remove_column table_name, :archived
    end
  end

  def active?
    !archived
  end

  def archive!
    return true if archived?
    run_callbacks :archive do
      if self.class.archive_as.present?
        # treat this archive! as if you had triggered it on the parent
        # e.g. by archiving a Collection we should really be archiving its parent card
        return try(self.class.archive_as).try(:archive_with_relations!)
      end
      archive_with_relations!
    end
  end

  # will first archive all of the `archive_with` relations, and then archive the model itself
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
  end
end
