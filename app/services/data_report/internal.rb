module DataReport
  class Internal < Base
    def call
      if @measure == 'records'
        # special case
        return combine_collection_and_item_reports
      end
      @query = generate_base_query
      return unless @query
      @query = filtered_query
      calculate
      @data
    end

    private

    def combine_collection_and_item_reports
      # create temp DataItems to create item and collection reports
      d_items = @data_item.amoeba_dup
      d_items.organization_id = @data_item.organization_id
      d_items.d_measure = 'items'
      d_collections = @data_item.amoeba_dup
      d_collections.organization_id = @data_item.organization_id
      d_collections.d_measure = 'collections'
      item_data = d_items.data
      collection_data = d_collections.data
      # now combine the two reports
      @data[:value] = item_data[:value] + collection_data[:value]
      @data[:values] =
        (item_data[:values] + collection_data[:values]).group_by { |x| x[:date] }.map do |date, values|
          { date: date, amount: values.map { |x| x[:amount] }.sum }
        end
      @data
    end

    def generate_base_query
      case @measure
      when 'participants'
        Activity.where_participated
      when 'viewers'
        Activity.where_viewed
      when 'activity'
        Activity.where_active
      when 'content'
        Activity.where_content
      when 'collections'
        Collection.data_collectable.active
      when 'items'
        Item.active
      end
    end

    def filtered_query
      collection_filter = @filters&.find { |x| x['type'] == 'Collection' }
      if collection_filter && collection_filter['target']
        collection_opts = { collection_id: collection_filter['target'] }
        if measure_queries_activities?
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
        elsif @measure == 'collections'
          @query.where(%(breadcrumb @> ':collection_id' or
                         id = :collection_id),
                       collection_opts)
        elsif @measure == 'items'
          @query.where(%(breadcrumb @> ':collection_id'),
                       collection_opts)
        end
      else
        # default, within entire org
        if @measure == 'items'
          @query
            .joins(parent_collection_card: :parent)
            .where('collections.organization_id = ?', @data_item.organization_id)
        else
          @query
            .where(organization_id: @data_item.organization_id)
        end
      end
    end

    def measure_queries_activities?
      !%w[collections items records].include?(@measure)
    end

    def query_table
      return Activity if measure_queries_activities?
      case @measure
      when 'collections'
        Collection
      when 'items'
        Item
      else
        return
      end
    end

    def calculate
      if @timeframe && @timeframe != 'ever'
        calculate_timeframe_values
      else
        calculate_single_value
      end
    end

    def calculate_timeframe_values
      sql_table = query_table.table_name
      earliest = @query.select("min(#{sql_table}.created_at)").to_a.first.min
      return unless earliest.present?

      min = [earliest, 6.months.ago].max
      case @measure
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
      sql = %{
        SELECT
          LEAST(series.date, now()::DATE) date,
          (
            SELECT #{selection}
              FROM (#{@query.select(*columns).to_sql}) inner_query
              WHERE
                created_at BETWEEN
                  LEAST(series.date, now()::DATE) - INTERVAL '1 #{@timeframe}'
                  AND
                  LEAST(series.date, now()::DATE) + INTERVAL '1 #{@timeframe}'
          )
        FROM
          GENERATE_SERIES(
            ('#{min.send("beginning_of_#{@timeframe}")}'::DATE + INTERVAL '1 #{@timeframe}'),
            now()::DATE + INTERVAL '1 #{@timeframe}',
            INTERVAL '1 #{@timeframe}'
          ) AS series
        ORDER BY series.date;
      }
      values = query_table.connection.execute(sql)
                          .map { |val| { date: val['date'], amount: val['count'] } }
                          .uniq { |i| i[:date] } # this will filter out dupe when final series.date == now()

      @data[:values] = values
    end

    def calculate_single_value
      case @measure
      when 'participants', 'viewers'
        value = @query
                .select(:actor_id)
                .distinct
                .count
      when 'activity', 'content', 'collections', 'items'
        value = @query.count
      else
        return
      end
      @data[:value] = value
    end
  end
end
