class Search
  module Filters
    class ActivityDateRange < Base
      DATE_FORMAT_REGEXP = /(\d{1,2}\/\d{1,2}\/\d{4})/
      REGEXP = /(Not)?Updated\(#{DATE_FORMAT_REGEXP},\s*#{DATE_FORMAT_REGEXP}\s*\)/i
      def options
        not_in_range, first_date, last_date = @query.scan(REGEXP).flatten

        where = {}
        return where unless first_date && last_date

        beginning = Date.strptime(first_date, '%d/%m/%Y')
        ending = Date.strptime(last_date, '%d/%m/%Y')

        if beginning && ending
          if not_in_range
            where[:_or] = [{
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
            where[:activity_dates] = {
              gte: beginning,
              lte: ending,
            }
          end
        end
        { where: where }
      end

      def modify_query
        remove_regexp
      end
    end
  end
end
