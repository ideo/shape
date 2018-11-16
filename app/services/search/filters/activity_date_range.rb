class Search
  module Filters
    class ActivityDateRange < Base
      DATE_FORMAT_REGEXP = /(\d{1,2}\/\d{1,2}\/\d{4})/
      REGEXP = /(Not)?Updated\(#{DATE_FORMAT_REGEXP},\s*#{DATE_FORMAT_REGEXP}\s*\)/i
      def where
        not_in_range, first_date, last_date = @query.scan(REGEXP).flatten

        where_clause = {}
        return where_clause unless first_date && last_date

        beginning = Date.strptime(first_date, '%d/%m/%Y')
        ending = Date.strptime(last_date, '%d/%m/%Y')

        if beginning && ending
          if not_in_range
            where_clause[:_or] = [{
              activity_dates: {
                lt: beginning,
              },
            }, {
              activity_dates: {
                gt: ending,
              },
            }, {
              activity_dates: nil,
            }]
          else
            where_clause[:activity_dates] = {
              gte: beginning,
              lte: ending,
            }
          end
        end
        where_clause
      end

      def modify_query
        remove_regexp
      end
    end
  end
end
