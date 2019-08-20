class CollectionCardFilter < SimpleService
  def initialize(collection:, user:, filters:, application: nil, ids_only: false)
    @collection_order = nil
    @collection = collection
    @user = user
    @filters = filters
    @application = application
    @cards = []
    @ids_only = ids_only
  end

  def call
    initialize_cards
    apply_order unless @ids_only
    apply_hidden

    if public_collection? && user_does_not_have_access?
      filter_for_public
    elsif @user.present?
      filter_for_user
    else
      return []
    end

    # API should always have user (e.g. application_bot) present
    if @filters[:external_id].present? && @application.present?
      filter_external_id
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
    if @ids_only
      # start with all_collection_cards to unscope the order, and `active` will be applied below
      @cards = @collection.all_collection_cards
    elsif @collection.is_a?(Collection::Board)
      # Defaults to 16x16 since we default to a fully zoomed-out view
      rows = @filters[:rows].is_a?(Array) ? @filters[:rows] : [0, 16]
      cols = @filters[:cols].is_a?(Array) ? @filters[:cols] : [0, 16]
      @cards = @collection.collection_cards_by_row_and_col(
        rows: rows,
        cols: cols,
      )
    else
      # ensure per_page is between 50 and 200
      per_page = [@filters[:per_page].to_i, CollectionCard::DEFAULT_PER_PAGE].max
      per_page = [per_page, 200].min
      if @filters[:q].present?
        where_clause = {
          archived: false,
          _or: [
            {
              _type: 'item',
              _id: @collection.items_and_linked_items.map(&:id),
            },
            {
              _type: 'collection',
              _id: @collection.collections_and_linked_collections.map(&:id),
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
      else
        @cards = @collection.collection_cards_by_page(
          page: @filters[:page],
          per_page: per_page,
        )
      end
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
    @cards = @cards
             .includes(
               collection: [:collection_cover_items],
               item: [
                 :filestack_file,
                 data_items_datasets: [:dataset],
               ],
             )
  end

  def filter_for_user
    # Do no filtering if user is super admin
    return if @user.has_cached_role?(Role::SUPER_ADMIN)

    group_ids = @user.all_current_org_group_ids
    resource_identifier_sql = %(
      CASE WHEN COALESCE(
        items.roles_anchor_collection_id,
        collections.roles_anchor_collection_id
      ) IS NOT NULL
      THEN
        CONCAT('Collection_', COALESCE(
          items.roles_anchor_collection_id,
          collections.roles_anchor_collection_id
        ))
      ELSE
        CONCAT(
          (CASE WHEN collection_cards.item_id IS NOT NULL THEN 'Item' ELSE 'Collection' END),
          '_',
          COALESCE(collection_cards.item_id, collection_cards.collection_id)
        )
      END
    )
    join_sql = %(
      LEFT JOIN items ON items.id = collection_cards.item_id
      LEFT JOIN collections ON collections.id = collection_cards.collection_id
      JOIN roles ON (
        roles.resource_identifier = #{resource_identifier_sql}
      )
      LEFT JOIN users_roles ON
      users_roles.role_id = roles.id and
      users_roles.user_id = #{@user.id}
      LEFT JOIN groups_roles ON
      groups_roles.role_id = roles.id and
      groups_roles.group_id IN (#{group_ids.present? ? group_ids.join(',') : 'NULL'})
    )

    if @ids_only
      fields = ['collection_cards.id']
    else
      fields = ['collection_cards.*']
    end
    fields << @collection_order if @collection_order.present?

    @cards = @cards
             .joins(join_sql)
             .select(*fields)
             .where('coalesce(users_roles.id, groups_roles.id) IS NOT NULL')
             .distinct
  end

  def filter_for_public
    fields = ['collection_cards.*']
    fields << @collection_order if @collection_order.present?
    @cards = @cards
             .left_joins(:item, :collection)
             .select(*fields)
             .where(
               "(item_id IS NOT NULL AND items.cached_attributes->'cached_inheritance'->>'private'='false') OR " \
               "(collection_id IS NOT NULL AND collections.cached_attributes->'cached_inheritance'->>'private'='false')",
             )
             .distinct
  end

  def apply_order
    card_order = @filters[:card_order]
    order = { order: :asc }
    if card_order
      if card_order == 'total' || card_order.include?('question_')
        @collection_order = "collections.cached_test_scores->'#{card_order}'"
        order = Arel.sql("#{@collection_order} DESC NULLS LAST")
      else
        # e.g. updated_at
        order = { card_order => :desc }
      end
    end

    @cards = @cards.order(order)
  end

  def apply_hidden
    # `hidden` means include both hidden and unhidden cards
    @cards = @cards.visible unless @filters[:hidden].present?
  end

  def filter_external_id
    join_sql = %(
      INNER JOIN external_records ON external_records.externalizable_id = COALESCE(collection_cards.item_id, collection_cards.collection_id)
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
end
