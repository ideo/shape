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
    end
  end

  def filtered_query
    collection_filter = @filters&.find { |x| x['type'] == 'Collection' }
    if collection_filter
      @query.where(target_type: %w[Collection Item])
            .joins(%(left join collections on
                       activities.target_id = collections.id and
                       activities.target_type = 'Collection'))
            .joins(%(left join items on
                       activities.target_id = items.id and
                       activities.target_type = 'Item'))
            .where(%(collections.breadcrumb @> ':collection_id' or
                       items.breadcrumb @> ':collection_id' or
                       collections.id = :collection_id),
                   collection_id: collection_filter['target'])
    else
      # default, within entire org
      @query
        .where(organization_id: @data_item.parent.organization_id)
    end
  end

  def calculate
    case @measure
    when 'participants', 'viewers'
      # TODO: respect the actual timeframe value
      # currently it is hardcoded to weekly data points that show "past 30 days" activity
      if @timeframe && @timeframe != 'ever'
        if @query.count.zero?
          @data[:values] = []
          return
        end
        min = [@query.select('min(activities.created_at)').to_a.first.min, 6.months.ago].max
        # doing the BETWEEN upper limit we actually query "date + 1", meaning for January 1
        # we are actually finding all activities created before January 2 00:00
        sql = %{
          SELECT
            LEAST(series.date, now()::DATE) date,
              (
                SELECT COUNT(DISTINCT(actor_id))
                  FROM (#{@query.select(:actor_id, :created_at).to_sql}) mod_activities
                  WHERE
                    created_at BETWEEN
                      LEAST(series.date, now()::DATE) - 30
                      AND
                      LEAST(series.date, now()::DATE) + 1
              )
          FROM
            GENERATE_SERIES(
              ('#{min.beginning_of_month}'::DATE + INTERVAL '30 days'),
              now()::DATE + INTERVAL '1 week',
              INTERVAL '1 week'
            ) AS series
          ORDER BY series.date;
        }
        values = Activity.connection.execute(sql)
                         .map { |val| { date: val['date'], amount: val['count'] } }
                         .uniq { |i| i[:date] } # this will filter out dupe when final series.date == now()

        @data[:values] = values
      else
        @data[:value] = @query
                        .select(:actor_id)
                        .distinct
                        .count

      end
    end
  end
end
