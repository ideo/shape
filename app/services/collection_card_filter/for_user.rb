module CollectionCardFilter
  class ForUser < Base
    def initialize(cards_scope:, user:, collection_order: nil, ids_only: false)
      @cards_scope = cards_scope
      @user = user
      @collection_order = collection_order
      @ids_only = ids_only
    end

    def call
      # Do no filtering if user is super admin
      return @cards_scope if @user.has_cached_role?(Role::SUPER_ADMIN)

      apply_filter
    end

    private

    def apply_filter
      @cards_scope
        .joins(join_sql)
        .select(*fields)
        .where('coalesce(users_roles.id, groups_roles.id) IS NOT NULL')
        .distinct
    end

    def join_sql
      %(
        LEFT JOIN items ON items.id = collection_cards.item_id
        LEFT JOIN collections ON collections.id = collection_cards.collection_id
        JOIN roles ON (
          roles.resource_identifier = #{Collection.roles_anchor_identifier_sql}
        )
        LEFT JOIN users_roles ON
        users_roles.role_id = roles.id and
        users_roles.user_id = #{@user.id}
        LEFT JOIN groups_roles ON
        groups_roles.role_id = roles.id and
        groups_roles.group_id IN (#{group_ids.present? ? group_ids.join(',') : 'NULL'})
      )
    end
  end
end
