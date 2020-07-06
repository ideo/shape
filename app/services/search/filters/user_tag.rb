class Search
  module Filters
    class UserTag < Base
      # [:word] should work for UTF-8 e.g. CJK characters
      REGEXP = /@[[:word:]\-_]+/.freeze

      def options
        where = {}
        # `where` option is case-sensitive so we have to downcase the search
        # https://github.com/ankane/searchkick/issues/177#issuecomment-340422886
        where[:user_tags] = { all: user_tags } if user_tags.count.positive?
        { where: where }
      end

      private

      def user_tags
        @query.scan(REGEXP).flatten.map do |user_tag|
          user_tag.delete('@').downcase
        end
      end
    end
  end
end
