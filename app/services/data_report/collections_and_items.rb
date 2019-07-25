module DataReport
  class CollectionsAndItems < SimpleService
    delegate :measure, :timeframe, to: :@dataset

    def initialize(dataset:)
      @dataset = dataset
      @record = dataset.data_source
      @data = nil
      @single_value = nil
      @is_single_value = false
      @query = nil
    end

    def call
      if measure == 'records'
        collections_and_items_report_dataset
      else
        initialize_data
        calculate_timeframe_values
      end
      @data
    end

    def single_value
      @is_single_value = true
      if measure == 'records'
        collections_and_items_report_dataset
      else
        initialize_data
        calculate_single_value
      end
      @single_value
    end

    def actor_ids
      initialize_data
      query_actor_ids
    end

    private

    def single_value?
      @is_single_value
    end

    def organization_id
      @dataset.organization_id || @record&.organization_id
    end

    def initialize_data
      @query = generate_base_query
      return [] unless @query
      @query = filtered_query
    end

    def collections_and_items_report_dataset
      item_data = DataReport::CollectionsAndItems.new(dataset:
        Dataset.new(
          data_source: @record,
          measure: 'items',
          timeframe: timeframe,
          organization_id: organization_id,
        ))

      collection_data = DataReport::CollectionsAndItems.new(dataset:
        Dataset.new(
          data_source: @record,
          measure: 'collections',
          timeframe: timeframe,
          organization_id: organization_id,
        ))

      if single_value?
        # Combine the two reports
        # Call .to_i on single_value because it may be nil (only present if timeframe is `ever`)
        @single_value = item_data.single_value.to_i + collection_data.single_value.to_i
      else
        concatenated = (item_data.call + collection_data.call)
        all_values = concatenated.group_by { |x| x[:date] }
        @data = all_values.map do |date, values|
          {
            date: date,
            value: values.map { |x| x[:value] }.sum,
          }
        end
      end
    end

    # The fact that we are doing this indicates that it should probably be a separate object
    def generate_base_query
      p "GENERATE BASE QUERY: #{measure}"
      case measure
      when 'participants'
        Activity.for_org(organization_id).where_participated
      when 'viewers'
        Activity.for_org(organization_id).where_viewed
      when 'activity'
        Activity.for_org(organization_id).where_active
      when 'content'
        Activity.for_org(organization_id).where_content
      when 'collections'
        Collection.data_collectable.active
      when 'items'
        Item.active
      end
    end

    def filtered_query
      p "FILTERED QUERY: #{@record}" * 100
      p "measure_queries_activities: #{measure_queries_activities?}"
      if @record.is_a?(Collection)
        collection_opts = { collection_id: @record.id }
        if measure_queries_activities?
          # TODO: How can we improve this?
          @query.where(target_type: %w[Collection Item])
                .joins(%(left join collections on
                           activities.target_id = collections.id and
                           activities.target_type = 'Collection'))
                .joins(%(left join items on
                           activities.target_id = items.id and
                           activities.target_type = 'Item'))
                .where(%(coalesce(collections.breadcrumb, items.breadcrumb) @> ':collection_id' or
                           collections.id = :collection_id),
                       collection_opts)
        elsif measure == 'collections'
          @query.where(%(breadcrumb @> ':collection_id' or
                         id = :collection_id),
                       collection_opts)
        elsif measure == 'items'
          @query.where(%(breadcrumb @> ':collection_id'),
                       collection_opts)
        end
      else
        # default, within entire org
        if measure == 'items'
          @query
            .joins(parent_collection_card: :parent)
            .where('collections.organization_id = ?', organization_id)
        else
          @query
            .where(organization_id: organization_id)
        end
      end
    end

    def measure_queries_activities?
      !%w[collections items records].include?(measure)
    end

    def query_table
      return Activity if measure_queries_activities?
      case measure
      when 'collections'
        Collection
      when 'items'
        Item
      else
        return
      end
    end

    def calculate_timeframe_values
      p "CALCULATE TIMEFRAME VALUES" * 100
      p sql_table = query_table.table_name
      p earliest = @query.select("min(#{sql_table}.created_at)").to_a.first.min

      return unless earliest.present?

      min = [earliest, 6.months.ago].max
      case measure
      when 'participants', 'viewers'
        selection = 'count(distinct(actor_id))'
      when 'activity', 'content', 'collections', 'items'
        selection = 'count(*)'
      else
        return
      end

      # Doing the BETWEEN upper limit we actually query "date + 1", meaning for January 1
      # we are actually finding all activities/collections created before January 2 00:00
      columns = %i[id created_at]
      columns.push(:actor_id) if measure_queries_activities?
      # TODO: How can we improve this?
      sql = %{
        SELECT
          LEAST(series.date, now()::DATE) date,
          (
            SELECT #{selection}
              FROM (#{@query.select(*columns).to_sql}) inner_query
              WHERE
                created_at BETWEEN
                  LEAST(series.date, now()::DATE) - INTERVAL '1 #{timeframe}'
                  AND
                  LEAST(series.date, now()::DATE) + INTERVAL '1 #{timeframe}'
          )
        FROM
          GENERATE_SERIES(
            ('#{min.send("beginning_of_#{timeframe}")}'::DATE + INTERVAL '1 #{timeframe}'),
            now()::DATE + INTERVAL '1 #{timeframe}',
            INTERVAL '1 #{timeframe}'
          ) AS series
        ORDER BY series.date;
      }

      values = query_table.connection.execute(sql)
                          .map { |val| { date: val['date'], value: val['count'] } }
                          .uniq { |i| i[:date] } # this will filter out dupe when final series.date == now()

      @data = values
    end

    def query_actor_ids
      @query
        .select(:actor_id)
        .distinct
        .pluck(:actor_id)
    end

    def calculate_single_value
      case measure
      when 'participants', 'viewers'
        value = @query
                .select(:actor_id)
                .distinct
      when 'activity', 'content', 'collections', 'items'
        value = @query
      else
        return
      end

      @single_value = value.count
    end
  end
end
