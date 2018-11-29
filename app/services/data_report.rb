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
      @data[:value] = @query
                      .select(:actor_id)
                      .distinct
                      .count

      # TODO: sql injection?
      if @timeframe && @timeframe != 'ever'
        @data[:values] = @query
                         .distinct
                         .group("date_trunc('#{@timeframe}', created_at) ")
                         .count
                         .map { |k, v| { date: k, amount: v } }
      end
    end
  end
end
