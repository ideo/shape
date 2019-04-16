class Collection
  class Board < Collection
    COLS = 16
    # Re-define association to use `ordered_row_col` scope,
    # so cards are in correct order according to row and col
    has_many :collection_cards,
             -> { active.ordered_row_col },
             class_name: 'CollectionCard',
             foreign_key: :parent_id,
             inverse_of: :parent

    def self.allowed_col_range
      0..(COLS - 1)
    end

    def max_row_index
      collection_cards.maximum(:row)
    end

    def max_col_index
      collection_cards.maximum(:col)
    end
  end
end
