class Collection
  class Board < Collection
    COLS = 16

    def max_row_index
      collection_cards.maximum(:row)
    end

    def max_col_index
      collection_cards.maximum(:col)
    end
  end
end
