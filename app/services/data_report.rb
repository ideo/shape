# 1. measure determines the base query
# 2. filters add themselves to the query
# 3. timeframe = within these dates
class DataReport < SimpleService
  def initialize(data_item)
    @data_item = data_item
    @measure = data_item.d_measure
    @filters = data_item.d_filters
    @timeframe = data_item.d_timeframe
    @data = {
      # e.g. if there was a chart of values...
      values: [],
      value: 0,
    }
  end

  def call
    @query = generate_base_query
    return unless @query
    @query = filtered_query
    calculate
    @data
  end

  private

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
      Collection.searchable
    when 'items'
      Item
    when 'records'
      CollectionCard::Primary
    end
  end

  def filtered_query
    collection_filter = @filters&.find { |x| x['type'] == 'Collection' }
    if collection_filter
      if query_activities?
        @query.where(target_type: %w[Collection Item])
              .joins(%(left join collections on
                         activities.target_id = collections.id and
                         activities.target_type = 'Collection'))
              .joins(%(left join items on
                         activities.target_id = items.id and
                         activities.target_type = 'Item'))
              .where(%(coalesce(collections.breadcrumb, items.breadcrumb) @> ':collection_id' or
                         collections.id = :collection_id),
                     collection_id: collection_filter['target'])
      elsif @measure == 'records'
        @query.joins(%(left join collections on
                         collection_cards.collection_id = collections.id
                         ))
              .joins(%(left join items on
                         collection_cards.item_id = items.id
                         ))
              .where(%(collections.breadcrumb @> ':collection_id' or
                       items.breadcrumb @> ':collection_id' or
                       collections.id = :collection_id),
                     collection_id: collection_filter['target'])
      else
        @query.where(%(breadcrumb @> ':collection_id' or
                       id = :collection_id),
                     collection_id: collection_filter['target'])
      end
    else
      # default, within entire org
      if @measure == 'items'
        @query
          .joins(parent_collection_card: :parent)
          .where('collections.organization_id = ?', @data_item.parent.organization_id)
      elsif @measure == 'records'
        @query
          .joins(:parent)
          .where('collections.organization_id = ?', @data_item.parent.organization_id)
      else
        @query
          .where(organization_id: @data_item.parent.organization_id)
      end
    end
  end

  def query_activities?
    !%w[collections items records].include?(@measure)
  end

  def query_table
    return Activity if query_activities?
    case @measure
    when 'collections', 'records'
      Collection
    when 'items'
      Item
    when 'records'
      CollectionCard
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
    when 'activity', 'content', 'collections', 'items', 'records'
      selection = 'count(*)'
    else
      return
    end

    # Doing the BETWEEN upper limit we actually query "date + 1", meaning for January 1
    # we are actually finding all activities/collections created before January 2 00:00
    columns = %i[id created_at]
    columns.push(:actor_id) if query_activities?
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
    when 'activity', 'content', 'collections', 'items', 'records'
      value = @query.count
    else
      return
    end
    @data[:value] = value
  end
end
