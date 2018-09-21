module Breadcrumbable
  extend ActiveSupport::Concern

  included do
    after_create :recalculate_breadcrumb!, if: :calculate_breadcrumb?
    before_update :calculate_breadcrumb
  end

  class_methods do
    # Helpers to add breadcrumb field to any model
    #
    # e.g. in a migration:
    # def up; Item.add_breadcrumb_column!; end

    def add_breadcrumb_column!
      connection.add_column table_name, :breadcrumb, :jsonb
      connection.add_index table_name, :breadcrumb, using: :gin
    end

    def remove_breadcrumb_column!
      connection.remove_column table_name, :breadcrumb
    end

    def in_collection(collection_or_id, subtree_identifier = nil)
      if collection_or_id.is_a?(Collection)
        collection = collection_or_id
      else
        collection = Collection.find(collection_or_id)
      end
      subtree_identifier ||= collection.breadcrumb_subtree_identifier
      scoped = active.where('breadcrumb @> ?', subtree_identifier)
      # in_collection should not return the collection itself
      scoped = scoped.where.not(id: collection.id) if base_class == Collection
      # order from the top of the tree down
      scoped.order('jsonb_array_length(breadcrumb) ASC')
    end
  end

  # Override this method in any classes to restrict
  # this object from the breadcrumb
  def breadcrumbable?
    true
  end

  # Returns an array of breadcrumb items that this user has permissions to see
  def breadcrumb_viewable_by(user = nil)
    return [] if user.blank? || breadcrumb.nil?
    breadcrumb_for_user(user).viewable
  end

  # Returns the singular breadcrumb item for this object
  def to_breadcrumb_item
    Breadcrumb::Builder.for_object(self)
  end

  # really just an alias for save since before_update will call calculate_breadcrumb
  def recalculate_breadcrumb!
    save
  end

  def breadcrumb_subtree_identifier
    return if breadcrumb.blank?

    [breadcrumb.last].to_s
  end

  def breadcrumb_subtree_identifier_was
    was = @breadcrumb_was || breadcrumb_was
    return if was.blank?

    [was.last].to_s
  end

  # Loads all children and recalculates all at once
  def recalculate_breadcrumb_tree!(subtree_identifier: nil, force_sync: false)
    return recalculate_breadcrumb! unless is_a?(Collection)

    child_collections = Collection.in_collection(self, subtree_identifier)
    child_items = Item.in_collection(self, subtree_identifier)
    num = child_collections.size + child_items.size

    # If greater than 50 items, queue to worker
    if num.size > 50 && !force_sync
      BreadcrumbRecalculationWorker.perform_async(id, subtree_identifier)
    else
      # Otherwise perform immediately
      child_collections.each(&:recalculate_breadcrumb!)
      child_items.each(&:recalculate_breadcrumb!)
    end
    true
  end

  def breadcrumb_contains?(object: nil, id: nil, klass: nil)
    found = false
    if object
      found = breadcrumb.include?(object.to_breadcrumb_item)
    else
      breadcrumb.each do |crumb|
        if crumb[0] == klass && crumb[1] == id
          found = true
          break
        end
      end
    end
    found
  end

  private

  def calculate_breadcrumb
    @breadcrumb_was = breadcrumb
    self.breadcrumb = Breadcrumb::Builder.call(self)
  end

  def breadcrumb_for_user(user)
    Breadcrumb::ForUser.new(
      breadcrumb,
      user,
    )
  end

  def calculate_breadcrumb?
    breadcrumb.blank?
  end
end
