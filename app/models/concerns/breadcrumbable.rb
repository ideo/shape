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

    def in_collection(collection_or_id)
      if collection_or_id.is_a?(Collection)
        collection_id = collection_or_id.id
      else
        collection_id = collection_or_id
      end
      scoped = active.where('breadcrumb @> ?', [collection_id].to_s)
      # order from the top of the tree down
      scoped.order('jsonb_array_length(breadcrumb) ASC')
    end
  end

  def all_child_collections
    Collection.in_collection(self)
  end

  def all_child_items
    Item.in_collection(self)
  end

  def parents
    Collection.where(id: breadcrumb)
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
  def recalculate_breadcrumb_tree!(force_sync: false)
    return recalculate_breadcrumb! unless is_a?(Collection)
    # start with self
    recalculate_breadcrumb!
    num = all_child_collections.count + all_child_items.count

    # If greater than 50 items, queue to worker
    if num > 50 && !force_sync
      BreadcrumbRecalculationWorker.perform_async(id)
    else
      # Otherwise perform immediately
      all_child_collections.find_each(&:recalculate_breadcrumb!)
      all_child_items.find_each(&:recalculate_breadcrumb!)
    end
    true
  end

  def within_collection_or_self?(collection)
    return true if collection == self
    breadcrumb.include?(collection.id)
  end

  def any_parent_unsubscribed?(user)
    record_unsubscribed = false
    parents.each do |r|
      record_unsubscribed = record_unsubscribed?(r, user)
      break if record_unsubscribed
    end
    record_unsubscribed
  end

  private

  def calculate_breadcrumb
    @breadcrumb_was = breadcrumb
    self.breadcrumb = Breadcrumb::Builder.call(self)
  end

  def breadcrumb_for_user(user)
    Breadcrumb::ForUser.new(
      self,
      user,
    )
  end

  def calculate_breadcrumb?
    breadcrumb.blank?
  end

  def record_unsubscribed?(record, user)
    return false if record.comment_thread.nil?
    users_thread = record.comment_thread.users_thread_for(user)
    return false if users_thread.nil?
    !users_thread.subscribed
  end
end
