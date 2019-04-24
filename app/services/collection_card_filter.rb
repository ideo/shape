class CollectionCardFilter
  def initialize(collection_or_scope:)
    if collection_or_scope.is_a?(Collection)
      @cards = collection_or_scope.collection_cards
    else
      @cards = collection_or_scope
    end
    @cards = @cards.active
                   .includes(
                     collection: [:collection_cover_items],
                     item: [:filestack_file]
                   )
  end

  def viewable_by_anyone
    @cards = @cards.visible
    @cards
  end

  def viewable_by(
    user,
    card_order: nil,
    hidden: false
  )
    apply_order(card_order)

    # `hidden` means include both hidden and unhidden cards
    @cards = @cards.visible unless hidden

    filter_for_user(user) unless user.has_cached_role?(Role::SUPER_ADMIN)

    @cards
  end

  private

  def filter_for_user(user)
    group_ids = user.current_org_group_ids
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
      users_roles.user_id = #{user.id}
      LEFT JOIN groups_roles ON
      groups_roles.role_id = roles.id and
      groups_roles.group_id IN (#{group_ids.present? ? group_ids.join(',') : 'NULL'})
    )

    fields = ['collection_cards.*']
    fields << collection_order if collection_order.present?

    @cards = @cards
             .joins(join_sql)
             .select(*fields)
             .where('coalesce(users_roles.id, groups_roles.id) IS NOT NULL')
             .distinct
  end

  def apply_order(card_order)
    order = { order: :asc }
    collection_order = nil
    if card_order
      if card_order == 'total' || card_order.include?('question_')
        collection_order = "collections.cached_test_scores->'#{card_order}'"
        order = "#{collection_order} DESC NULLS LAST"
      else
        # e.g. updated_at
        order = { card_order => :desc }
      end
    end

    @cards = @cards.order(order)
  end
end
