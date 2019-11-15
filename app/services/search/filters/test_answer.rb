class Search
  module Filters
    class TestAnswer < Base
      REGEXP = %r{test_answer\(([A-Za-z0-9\_]+)\)}i.freeze

      def options
        {
          where: where_attrs,
        }
      end

      private

      def where_attrs
        return {} if test_answer.blank?

        {
          test_answer: test_answer,
        }
      end

      def test_answer
        @query.scan(REGEXP).flatten.first
      end
    end
  end
end
