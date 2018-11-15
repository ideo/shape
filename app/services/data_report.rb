# 1. measure determines the base query
# 2. filters add themselves to the query
# 3. timeframe = within these dates
class DataReport < SimpleService
  def initialize(data_item)
    @data_item = data_item
    @measure = data_item.d_measure
    @filters = data_item.d_filters
    @timeframe = data_item.d_timeframe
  end

  def call
    @query = generate_base_query
    return unless @query
    @query = filtered_query
    calculate
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
    # default, within entire org
    @query
      .where(organization_id: @data_item.parent.organization_id)
  end

  def calculate
    case @measure
    when 'participants', 'viewers'
      @query
        .select(:actor_id)
        .distinct
        .count
    end
  end
end
