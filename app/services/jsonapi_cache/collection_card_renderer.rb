require_dependency "#{Rails.root}/lib/jsonapi_mappings"

module JsonapiCache
  class CollectionCardRenderer < SimpleService
    # kick out old cached data
    EXPIRY_TIME = 1.week

    def initialize(
      cards: [],
      user: nil,
      collection: nil,
      search_records: nil,
      include_roles: false
    )
      @cards = cards
      @collection = collection
      @user = user
      @current_ability = Ability.new(@user)
      @search_result = search_records.present?
      @search_records = search_records
      @include_roles = include_roles
      @cached_data = {}
    end

    def call
      preload_roles_and_breadcrumb_collections
      fetch_multi_keys
      render_json_data
    end

    # this is also used for rendering a single card e.g. collection_cards#show
    def render_cached_card(card)
      json = cached_card_with_user_fields(
        cached_card_data(card),
        card.record,
      )
      json.merge(
        jsonapi: {
          version: '1.0',
        },
      )
    end

    private

    def cached_card_data(card)
      key = cache_key(card)
      cached = @cached_data[key]
      if cached.present?
        return cached
      end

      Rails.cache.fetch(key, expires_in: EXPIRY_TIME) do
        cache_card_json(card)
      end
    end

    def cache_card_json(card)
      includes = CollectionCard.default_relationships_for_api
      if @include_roles
        includes = [
          record: [
            :tagged_users,
            roles: %i[pending_users users groups resource],
          ],
        ]
      end
      renderer = JSONAPI::Serializable::Renderer.new
      renderer.render(
        card,
        class: JsonapiMappings::ALL_MAPPINGS,
        include: includes,
        expose: {
          inside_a_submission: inside_a_submission,
          inside_hidden_submission_box: inside_hidden_submission_box,
          include_roles: @include_roles,
        },
      )
    end

    def fetch_multi_keys
      card_map = {}
      cache_keys = []
      @cards.each do |card|
        key = cache_key(card)
        card_map[key] = card
        cache_keys << key
      end
      @cached_data = Rails.cache.fetch_multi(*cache_keys, expires_in: EXPIRY_TIME) do |cache_key|
        cache_card_json(card_map[cache_key])
      end
    end

    def cache_key(card)
      key = card.cache_key
      if @include_roles
        key += '--roles'
      end
      key
    end

    def render_json_data
      json_data = {
        data: [],
        included: [],
        jsonapi: {
          version: '1.0',
        },
      }
      # cache this onto the card.record to prevent unnecessary later queries
      common_viewable = @collection&.common_viewable?
      @cards.each do |card|
        json = cached_card_data(card)
        record = card.record
        if record && @current_ability.can?(:read, record)
          record.common_viewable = common_viewable if @collection.present?
          json = cached_card_with_user_fields(json, record)
          json_data = merge_included_data(json_data, json)
        else
          # don't include unreadable records if this is search result
          next if @search_result

          # private_card allows frontend to hide or display "private" as needed
          if card.is_a?(CollectionCard::Placeholder)
            json[:data][:attributes][:can_edit_parent] = can_edit_parent
          else
            json[:data][:attributes][:private_card] = true
          end
          # massage json api relationships to indicate this record is not included
          json[:data][:relationships][:record] = { meta: { included: false } }
        end
        json_data[:data].push(json[:data])
      end

      json_data
    end

    def merge_included_data(json_data, json)
      # merge any included records into the overall list
      json_data[:included] = (json[:included] + json_data[:included]).uniq do |i|
        [i[:id], i[:type]]
      end
      json_data
    end

    def cached_card_with_user_fields(json, record)
      json[:data][:attributes][:can_edit_parent] = can_edit_parent
      related = json[:data][:relationships][:record][:data]
      return json if json[:included].nil?

      related_json = json[:included].select { |r| r[:id] == related[:id] && r[:type] == related[:type] }.first
      related_json[:attributes][:can_view] = true
      related_json[:attributes][:can_edit] = @current_ability.can?(:edit, record)
      related_json[:attributes][:can_edit_content] = record.active? && @current_ability.can?(:edit_content, record)
      related_json[:attributes][:submission_reviewer_status] =
        record.present? && record.submission? && @user.present? ? record.submission_reviewer_status(@user) : nil
      if @search_result
        related_json[:attributes].merge!(breadcrumb_attributes(record))
      end

      if @include_roles && record.common_viewable && @user.current_organization_id != record.organization_id
        remove_role_ids = related_json[:relationships][:roles][:data].map { |i| i[:id] }
        related_json[:relationships][:roles][:data] = []
        json[:included].reject! { |i| i[:type] == :roles && remove_role_ids.include?(i[:id]) }
      end

      if record.is_a?(Item::LegendItem) && related_json[:relationships][:datasets].try(:[], :data)
        # probably no way around doing this query here since it is user-specific...
        viewable_dataset_ids = record.datasets_viewable_by(@user).pluck(:id).compact.map(&:to_s)
        related_json[:relationships][:datasets][:data].select! { |i| viewable_dataset_ids.include? i[:id] }
        json[:included].reject! { |i| i[:type] == :datasets && !viewable_dataset_ids.include?(i[:id]) }
      end

      json
    end

    def can_edit_parent
      return false if @collection.nil?

      @can_edit_parent ||= @current_ability.can?(:edit_content, @collection)
    end

    def breadcrumb_attributes(record)
      # search results need the full breadcrumb to display
      # NOTE: this is one of the heavier parts of this process, if there are additional ways to simplify
      breadcrumb = Breadcrumb::ForUser.new(
        record,
        @user,
      ).viewable_to_api

      {
        breadcrumb: breadcrumb,
        in_my_collection: @user&.in_my_collection?(record),
      }
    end

    def inside_a_submission
      return nil if @collection.nil?

      @inside_a_submission ||= (@collection.submission? || @collection.inside_a_submission?)
    end

    def inside_hidden_submission_box
      return nil if @collection.nil?

      @inside_hidden_submission_box ||= (@collection.hide_submissions || @collection.inside_hidden_submission_box?)
    end

    def preload_roles_and_breadcrumb_collections
      return if @user.nil?

      @user.precache_roles_for(
        [Role::VIEWER, Role::CONTENT_EDITOR, Role::EDITOR],
        resource_identifiers: resource_identifiers,
      )
    end

    def resource_identifiers
      cards = @cards.respond_to?(:reorder) ? @cards.reorder(nil) : @cards
      card_ids = cards.pluck(:id).compact
      identifiers = CollectionCard
                    .where(id: card_ids)
                    .joins(
                      %(
                        LEFT JOIN items ON items.id = collection_cards.item_id
                        LEFT JOIN collections ON collections.id = collection_cards.collection_id
                      ),
                    )
                    .select(%(
                      collection_cards.item_id,
                      collection_cards.collection_id,
                      #{Collection.roles_anchor_identifier_sql} AS sql_resource_identifier
                    ))
                    .map(&:sql_resource_identifier)
                    .uniq

      if @search_result
        # breadcrumb ids are always Collections so we can just query Collections
        identifiers += Collection
                       .where(id: @search_records.pluck(:breadcrumb).flatten)
                       .select(
                         %(
                           CASE WHEN
                             collections.roles_anchor_collection_id IS NOT NULL
                           THEN
                             CONCAT('Collection_', collections.roles_anchor_collection_id)
                           ELSE
                             CONCAT('Collection_', collections.id)
                           END
                           AS sql_resource_identifier
                         ),
                       )
                       .map(&:sql_resource_identifier)
        identifiers.uniq!
      end
      identifiers
    end
  end
end
