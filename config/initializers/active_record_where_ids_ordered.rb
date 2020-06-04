module ActiveRecordWhereIdsOrdered
  extend ActiveSupport::Concern
  module ClassMethods
    # Find all records with given ids, and return them in the same order as ids array
    # From: https://www.justinweiss.com/articles/how-to-select-database-records-in-an-arbitrary-order//
    def where_ids_ordered(ids)
      return where(id: ids) if ids.size <= 1

      order_clause = 'CASE id '

      ids.each_with_index do |id, index|
        order_clause << sanitize_sql_array(['WHEN ? THEN ? ', id, index])
      end

      order_clause << sanitize_sql_array(['ELSE ? END', ids.length])

      where(id: ids).order(Arel.sql(order_clause))
    end
  end
end

ActiveRecord::Base.include(ActiveRecordWhereIdsOrdered)
