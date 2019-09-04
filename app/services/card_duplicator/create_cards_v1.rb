module CardDuplicator
  class CreateCardsV1
    include Interactor
    require_in_context :to_collection, :placement, :cards
    delegate_to_context :to_collection, :placement, :cards, :for_user, :user_initiated, :building_template_instance

    def call
      set_context_defaults
      bump_existing_card_orders
      create_cards
    end

    private

    def set_context_defaults
      if context.user_initiated.nil?
        # true by default
        context.user_initiated = true
      end
      context.placement ||= 0
    end

    def bump_existing_card_orders
      return unless initial_order.is_a? Integer

      order = ActiveRecord::Base.connection.quote_column_name 'order'
      bumped_cards = to_collection.collection_cards.where(
        CollectionCard.arel_table[:order].gteq(initial_order),
      )

      if to_collection.templated?
        bumped_cards = bumped_cards.where(CollectionCard.arel_table[:pinned].eq(false))
      end

      bumped_cards.update_all(
        "#{order} = #{order} + #{cards.count}",
      )
    end

    def create_cards
      context.duplicated_collections = []
      context.duplicated_items = []
      context.duplicated_cards = []
      link_cards = []
      data_items_datasets = []

      filestack_files = CardDuplicator::DuplicateFilestackFiles.call(cards: cards_for_filestack_duplication).filestack_files

      cards.each_with_index do |original, i|
        # Skip if legend item - they will be moved over in `DuplicateLegendItems`
        next if original.item&.is_a?(Item::LegendItem)

        # if at a non-user-initiated level, link cards remain as links
        if !user_initiated && original.link?
          link_card = build_new_card_from(original, idx: i)
          context.duplicated_cards << link_card
          # we have to track the link_cards separately to import them without any Item/Collection
          link_cards << link_card
          next
        end

        if original.item_id.present?
          # see if we created a file for this...
          file = filestack_files.select { |ff| ff.original_item_id == original.item_id }.first
          new_item = build_new_item_from(original, idx: i, filestack_file: file)

          context.duplicated_items << new_item
          if original.item.is_a? Item::DataItem
            original.item.data_items_datasets.each do |di_dataset|
              dup = di_dataset.amoeba_dup
              dup.data_item = new_item
              data_items_datasets << dup
            end
          end
        elsif original.collection_id.present?
          context.duplicated_collections << build_new_collection_from(original, idx: i)
        end
      end

      Item.import(context.duplicated_items, recursive: true)
      Collection.import(context.duplicated_collections, recursive: true)
      CollectionCard.import(link_cards)
      # binding.pry
      Dataset.import(data_items_datasets.map(&:dataset))
      DataItemsDataset.import(data_items_datasets)

      # TODO: ...
      # result = Item.import...
      # if result.failed_instances.present?
      #   # .....
      # end
    end

    def cards_for_filestack_duplication
      cards.select do |card|
        next if card.link? && !user_initiated

        item = card.item
        item.present? && item.filestack_file.present?
      end
    end

    def build_new_item_from(original, idx:, filestack_file: nil)
      item = original.item
      new_card = build_new_card_from(original, idx: idx)
      context.duplicated_cards << new_card
      attrs = item.slice(item_attrs_to_copy).merge(
        breadcrumb: breadcrumb,
        cloned_from: item,
        roles_anchor_collection_id: roles_anchor_id,
        parent_collection_card: new_card,
        filestack_file: filestack_file,
      )
      item.class.new(attrs)
    end

    def build_new_collection_from(original, idx:)
      collection = original.collection
      new_card = build_new_card_from(original, idx: idx)
      context.duplicated_cards << new_card

      template = nil
      master_template = collection.master_template
      if collection.master_template? && to_collection.inside_a_template_instance?
        template = collection
        master_template = false
      end

      attrs = collection.slice(collection_attrs_to_copy).merge(
        # nullify UserProfile types during duplication
        type: collection.is_a?(Collection::UserProfile) ? nil : collection.type,
        breadcrumb: breadcrumb,
        cloned_from: collection,
        roles_anchor_collection_id: roles_anchor_id,
        created_by: for_user,
        parent_collection_card: new_card,
        # TODO: anything re: subtemplates as well...?
        template: template,
        master_template: master_template,
      )
      klass = collection.is_a?(Collection::UserProfile) ? Collection : collection.class
      klass.new(attrs)
    end

    def build_new_card_from(original, idx:)
      type = original.type
      attrs = original.slice(card_attrs_to_copy)
      if type == 'CollectionCard::Link'
        if user_initiated
          # turn links into primary cards when user initiates a duplication of a link card
          type = 'CollectionCard::Primary'
        else
          attrs[:item_id] = original.item_id
          attrs[:collection_id] = original.collection_id
        end
      end
      templated_from = nil
      if original.master_template_card? && to_collection.templated? && building_template_instance
        templated_from = original
      end

      if to_collection.is_a? Collection::Board
        row = to_collection.empty_row_for_moving_cards
        col = idx % 16
        if idx >= 16
          row += (idx / 16.0).floor
        end
        attrs[:row] = row
        attrs[:col] = col
      end

      CollectionCard.new(
        attrs.merge(
          parent: to_collection,
          order: initial_order + idx,
          pinned: should_pin?(original),
          type: type,
          templated_from: templated_from,
        ),
      )
    end

    def initial_order
      @initial_order ||= begin
        return 0 if placement.nil?

        case placement.to_s
        when 'beginning'
          0
        when 'end'
          to_collection.cached_card_count || to_collection.collection_cards.count
        else
          # a number
          placement.to_i || 0
        end
      end
      return @initial_order unless to_collection.templated?

      last_pinned = to_collection.collection_cards.pinned.last&.order || -1
      @initial_order = [@initial_order, last_pinned + 1].max
    end

    def roles_anchor_id
      @roles_anchor_id ||= to_collection.roles_anchor.id
    end

    def should_pin?(original_card)
      # Make it pinned if you're duplicating it into a master template
      to_collection.master_template? ||
        (original_card.pinned? && original_card.master_template_card? && building_template_instance)
    end

    def breadcrumb
      @breadcrumb ||= Breadcrumb::Builder.for_parent(to_collection)
    end

    def card_attrs_to_copy
      %i[
        width
        height
        hidden
        image_contain
        is_cover
        show_replace
      ]
    end

    def item_attrs_to_copy
      %i[
        name
        type
        content
        data_content
        icon_url
        legend_item_id
        legend_search_source
        question_type
        report_type
        thumbnail_url
        url
        tag_list
      ]
    end

    def collection_attrs_to_copy
      %i[
        name
        type
        organization_id
        tag_list
        cached_cover
      ]
    end
  end
end
