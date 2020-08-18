module CollectionCardFilter
  class Base < SimpleService
    def initialize(
      collection:,
      user:,
      filters:,
      application: nil,
      ids_only: false,
      select_ids: nil
    )
      @collection_order = nil
      @collection = collection
      @user = user
      @filters = filters
      @card_order = @filters.try(:[], :card_order)
      @application = application
      @cards = []
      # ids_only means literally just return collection card ids
      @ids_only = ids_only
      # select_ids limits the selection those card ids (still returning the full card)
      @select_ids = select_ids
    end

    def call
      initialize_cards
      apply_order
      apply_hidden

      if public_collection? && user_does_not_have_access?
        @cards = CollectionCardFilter::ForPublic.call(
          cards_scope: @cards,
          collection_order: @collection_order,
          ids_only: @ids_only,
        )
      elsif @user.nil?
        return []
      end

      # API should always have user (e.g. application_bot) present
      if @application.present?
        filter_external_id if @filters[:external_id].present?
        filter_identifier if @filters[:identifier].present?
      end

      if @ids_only
        return @cards.map do |cc|
          {
            id: cc.id.to_s,
            order: cc.order,
            row: cc.row,
            col: cc.col,
          }
        end
      end

      @cards
    end

    private

    def public_collection?
      @collection.anyone_can_view? || @collection.anyone_can_join?
    end

    def user_does_not_have_access?
      !@user || !@collection.can_view?(@user)
    end

    def initialize_cards
      # ensure per_page is between 50 and 200
      per_page = [@filters[:per_page].to_i, CollectionCard::DEFAULT_PER_PAGE].max
      per_page = [per_page, 200].min

      if @ids_only || @select_ids.present?
        # start with all_collection_cards to unscope the order, and `active` will be applied below
        @cards = @collection
                 .all_collection_cards
                 .not_placeholder
                 .ordered
        if @select_ids.present?
          cards_scope = @cards.where(id: @select_ids)
          if @collection.is_a?(Collection::SearchCollection)
            cards_scope = CollectionCard.where(id: @select_ids)
          end
          @cards = CollectionCardFilter::ForUser.call(
            cards_scope: cards_scope,
            user: @user,
          )
        else
          @cards = @cards.select(*fields)
        end
      elsif @filters[:q].present?
        where_clause = {
          archived: false,
          _or: [
            {
              _type: 'item',
              _id: @collection.items_and_linked_items.pluck(:id),
            },
            {
              _type: 'collection',
              _id: @collection.collections_and_linked_collections.pluck(:id),
            },
          ],
        }
        results = Search.new(
          index_name: [Item, Collection],
          where: where_clause,
          per_page: per_page,
          page: @filters[:page],
        ).search(@filters[:q])
        item_ids = results.results.select(&:item?).map(&:id)
        collection_ids = results.results.select(&:collection?).map(&:id)
        cc = CollectionCard.arel_table
        @cards = @collection.collection_cards.where(
          cc[:collection_id].in(collection_ids).or(
            cc[:item_id].in(item_ids),
          ),
        )
      elsif @collection.board_collection?
        # Defaults to 16x16 since we default to a fully zoomed-out view
        rows = @filters[:rows].is_a?(Array) ? @filters[:rows] : [0, 16]
        # make sure it's getting at least 4 rows
        rows[0] = rows[0].to_i
        rows[1] = [rows[1].to_i, (rows[0] + 4)].max
        cols = @filters[:cols].is_a?(Array) ? @filters[:cols] : [0, 16]
        @cards = @collection.collection_cards_by_row_and_col(
          rows: rows,
          cols: cols,
        )
      else
        @cards = @collection.collection_cards_by_page(
          page: @filters[:page],
          per_page: per_page,
        )
      end

      if @collection.archived? && @collection.archive_batch.present?
        # NOTE: not sure why some archived collections have unarchived cards inside;
        # but that is the reason for the `or(@cards.active)`
        @cards = @cards.where(
          archive_batch: @collection.archive_batch,
        ).or(@cards.active)
      else
        @cards = @cards.active
      end

      return @cards if @ids_only

      @cards = @cards.includes(CollectionCard.default_includes_for_api)
    end

    def apply_order
      order = { order: :asc }
      if @card_order
        if @card_order == 'total' || @card_order.include?('question_')
          @collection_order = "collections.cached_test_scores->'#{@card_order}'"
          order = Arel.sql("#{@collection_order} DESC NULLS LAST")
        else
          # e.g. updated_at
          order = { @card_order => :desc }
        end
      end

      @cards = @cards.reorder(order)
    end

    def apply_hidden
      # `hidden` means include both hidden and unhidden cards
      @cards = @cards.visible unless @filters[:hidden].present?
    end

    def filter_external_id
      join_sql = %(
        INNER JOIN external_records
        ON external_records.externalizable_id = COALESCE(collection_cards.item_id, collection_cards.collection_id)
      )

      @cards = @cards
               .joins(join_sql).where(
                 "(collection_cards.item_id IS NOT NULL AND external_records.externalizable_type = 'Item') OR " \
                 "(collection_cards.collection_id IS NOT NULL AND external_records.externalizable_type = 'Collection')",
               )
               .where(
                 ExternalRecord.arel_table[:external_id].eq(@filters[:external_id])
                 .and(
                   ExternalRecord.arel_table[:application_id].eq(@application.id),
                 ),
               )
    end

    def filter_identifier
      @cards = @cards.where(identifier: @filters[:identifier])
    end

    def fields
      if @ids_only
        arr = [
          'collection_cards.id',
          'collection_cards.order',
          'collection_cards.row',
          'collection_cards.col',
        ]
      else
        arr = ['collection_cards.*']
      end

      arr << @collection_order if @collection_order.present?

      arr
    end

    def group_ids
      @group_ids ||= @user.all_current_org_group_ids
    end
  end
end
