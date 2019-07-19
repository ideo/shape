class Search
  module Filters
    class Tag < Base
      REGEXP = /#\w+/

      def options
        tags = @query.scan(REGEXP).flatten.map { |tag| tag.delete('#') }
        where = {}
        # `where` option is case-sensitive so we have to downcase the search
        # https://github.com/ankane/searchkick/issues/177#issuecomment-340422886
        where[:tags] = { all: tags.map(&:downcase) } if tags.count.positive?
        { where: where }
      end
    end
  end
end
