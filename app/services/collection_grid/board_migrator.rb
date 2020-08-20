# migrate non-4WFC collections into 4WFC
module CollectionGrid
  class BoardMigrator
    include Interactor
    include Interactor::Schema

    schema :collection, :async
    require_in_context :collection

    def call
      migrate_collection_and_subcollections(context.collection)
    end

    private

    def migrate_collection_and_subcollections(collection)
      migrate_collection_to_board(collection)
      child_collections = collection.all_child_collections
      return if child_collections.empty?

      if context.async
        CollectionGrid::BoardMigratorWorker.perform_async(collection.id)
      else
        child_collections.find_in_batches do |batch|
          batch.each do |c|
            migrate_collection_to_board(c)
          end
        end
      end

      # if we migrate a master template then we also migrate the instances
      return unless collection.master_template? && !collection.subtemplate?

      puts "#{Time.current}: migrating instances of... #{collection.name} (#{collection.id})"
      collection.templated_collections.each do |c|
        migrate_collection_to_board(c)
      end
    end

    def migrate_collection_to_board(collection)
      return if skip_migration?(collection)

      puts "#{Time.current}: migrating... #{collection.name} (#{collection.id})"

      # special case
      if collection.is_a?(Collection::UserCollection)
        user = collection.editors[:users].first
        links = collection.link_collection_cards
        unviewable_ids = []
        if user.present? && links.any?
          links.each do |card|
            unless card.can_view?(user)
              unviewable_ids << card.id
            end
          end
          if unviewable_ids.present?
            CollectionCard
              .where(id: unviewable_ids)
              .update_all(archived: true, updated_at: Time.current, archived_at: Time.current)
          end
        end
      end

      # have to make into an array for bulk CollectionCard.import to work
      collection.collection_cards.hidden.update_all(order: nil)
      cards = collection.collection_cards.visible.map { |cc| Mashie.new(cc.as_json) }

      # apply row/col values onto ordered cards
      CollectionGrid::Calculator.calculate_rows_cols(
        cards,
        num_columns: 4,
      )
      cards.each do |cc|
        cc.order = nil
        cc.updated_at = Time.current
      end
      # bulk import cards with new row/col/order/updated_at values
      CollectionCard.import(
        cards,
        validate: false,
        on_duplicate_key_update: %i[row col order updated_at],
      )
      # finally update collection to have 4WFC format
      collection.update(num_columns: 4)
    end

    def skip_migration?(collection)
      return true if collection.board_collection?
      # don't migrate template instances unless their template has been migrated
      return true if collection.templated? && !collection.template.board_collection?

      type = collection.type&.gsub('Collection::', '')
      non_migratable_types = %w[
        TestCollection
      ]
      non_migratable_types.include?(type)
    end
  end
end
