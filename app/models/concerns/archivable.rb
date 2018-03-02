module Archivable
  extend ActiveSupport::Concern

  included do
    scope :archived, -> { where(archived: true) }
    scope :active, -> { where(archived: false) }
    default_scope -> { active }
  end

  class_methods do
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

  # e.g. collection_card.archive!(with: [:collection, :item])
  # will archive the card as well as its child objects
  def archive!(with: [])
    with.each do |relation|
      try(relation).try(:archive!)
    end
    update(archived: true)
  end
end
