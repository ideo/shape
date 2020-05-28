require_dependency "#{Rails.root}/lib/jsonapi_mappings"

module JsonapiCache
  class CollectionCardRenderer < SimpleService
    def initialize(
      cards: [],
      user: nil,
      collection: nil,
      search_records: nil
    )
      @cards = cards.to_a
      @collection = collection
      @user = user
      @current_ability = Ability.new(@user)
      @search_result = search_records.present?
      @search_records = search_records
    end

    def call
      preload_roles_and_breadcrumb_collections
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
      Rails.cache.fetch(card.cache_key) do
        renderer = JSONAPI::Serializable::Renderer.new
        renderer.render(
          card,
          class: JsonapiMappings::ALL_MAPPINGS,
          include: CollectionCard.default_relationships_for_api,
          expose: {
            inside_a_submission: inside_a_submission,
            inside_hidden_submission_box: inside_hidden_submission_box,
          },
        )
      end
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
        record.common_viewable = common_viewable if @collection.present?

        if @current_ability.can?(:read, record)
          json = cached_card_with_user_fields(json, record)

          # merge any included records into the overall list
          json_data[:included] = (json[:included] + json_data[:included]).uniq do |i|
            [i[:id], i[:type]]
          end
        else
          # don't include unreadable records if this is search result
          next if @search_result

          # private_card allows frontend to hide or display "private" as needed
          json[:data][:attributes][:private_card] = true
          # massage json api relationships to indicate this record is not included
          json[:data][:relationships][:record] = { meta: { included: false } }
        end
        json_data[:data].push(json[:data])
      end

      json_data
    end

    def cached_card_with_user_fields(json, record)
      related = json[:data][:relationships][:record][:data]
      related_json = json[:included].select { |r| r[:id] == related[:id] && r[:type] == related[:type] }.first
      related_json[:attributes][:can_view] = true
      related_json[:attributes][:can_edit] = @current_ability.can?(:edit, record)
      related_json[:attributes][:can_edit_content] = record.active? && @current_ability.can?(:edit_content, record)
      json[:data][:attributes][:can_edit_parent] = can_edit_parent
      if @search_result
        related_json[:attributes].merge!(breadcrumb_attributes(record))
      end

      if record.is_a?(Item::LegendItem)
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
      identifiers = CollectionCard
                    .where(id: @cards.pluck(:id).compact)
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
