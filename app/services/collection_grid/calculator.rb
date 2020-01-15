# ruby version of CollectionGridCalculator.js
module CollectionGrid
  class Calculator
    def self.group_by_consecutive(array, value)
      groups = []
      buffer = []
      array.count.times do |i|
        cur_item = array[i]
        if cur_item == value
          buffer.push(i)
        elsif buffer.count.positive?
          groups.push(buffer)
          buffer = []
        end
      end
      groups.push(buffer) if buffer.count.positive?
      groups
    end

    def self.top_left_card(cards)
      min_row, min_col = cards.pluck(:row, :col).min
      cards.find { |c| c.row == min_row && c.col == min_col }
    end

    # this will add row/col value to any set of cards, as if they were a 4-col layout
    def self.calculate_rows_cols(cards)
      row = 0
      matrix = []
      cols = 4
      # // create an empty row
      matrix.push(Array.new(cols))

      cards.each do |card|
        # object_id for unpersisted cards
        card_id = card.id || card.object_id
        filled = false
        until filled
          width = card.width
          height = card.height

          # // go through the row and see if there is an empty gap that fits cardWidth
          gaps = group_by_consecutive(matrix[row], nil)
          max_gap = gaps.find { |g| g.count >= width }
          max_gap_length = max_gap ? max_gap.count : 0

          if max_gap && max_gap_length
            filled = true

            col = max_gap.first
            card.col = col
            card.row = row
            # // fill rows and columns
            matrix[row].fill(card_id, col, width)

            (height - 1).times do |h|
              row_idx = row + h + 1
              matrix.push(Array.new(cols)) if matrix[row_idx].blank?
              matrix[row_idx].fill(card_id, col, width)
            end

            if matrix[row].last == card_id
              row += 1
              matrix.push(Array.new(cols)) if matrix[row].blank?
            end
          else
            row += 1
            matrix.push(Array.new(cols)) if matrix[row].blank?
          end
        end
      end
      cards
    end

    def self.card_max_row(card)
      return 0 if card.row.blank? || card.height.blank?

      card.row + card.height - 1
    end

    def self.card_max_col(card)
      return 0 if card.col.blank? || card.width.blank?

      card.col + card.width - 1
    end

    def self.board_matrix(collection:)
      return [] if collection.collection_cards.count.zero?

      max_col = 15
      max_row = collection.collection_cards.map { |card| card_max_row(card) }.max
      # matrix = Array.new(max_row + 1){Array.new(max_col + 1)}
      matrix = Array.new(16){Array.new(16)}

      collection.collection_cards.each do |card|
        rows =* (card.row..card_max_row(card) + 1)
        cols =* (card.col..card_max_col(card) + 1)

        rows.each do |row|
          cols.each do |col|
            matrix[row][col] = card
          end
        end
      end
      matrix
    end

    def self.determine_drag_map(
      master_card:,
      moving_cards:,
      from_collection:
    )
      if !from_collection.is_a?(Collection::Board)
        moving_cards.unshift(master_card)
        moving_cards = calculate_rows_cols(moving_cards)
      end
      drag_map = moving_cards.map do |card|
        row = card.row
        col = card.col
        master_col = master_card.col
        master_row = master_card.row
        Hashie::Mash.new(
          card: card,
          col: col - master_col,
          row: row - master_row,
        )
      end
      drag_map
    end

    def self.update_drag_grid_spot_with_open_position(
      card:,
      position:,
      open_spot_matrix:,
      drag_grid_spot:
    )
      open_spot = find_closest_open_spot(position, open_spot_matrix)
      return false unless open_spot
      card.row = open_spot[:row]
      card.col = open_spot[:col]
      drag_grid_spot[get_map_key(col: open_spot[:col], row: open_spot[:row])] = card
    end

    def self.get_map_key(col:, row:)
      "#{col},#{row}"
    end

    def self.foamcore_collision(
      row: row,
      col: col,
      master_card:,
      collection:,
      from_collection:,
      moving_cards:
    )
      drag_grid_spot = {}
      placeholder = Hashie::Mash.new(
        row: row,
        col: col,
        height: master_card.height,
        width: master_card.width,
      )
      open_spot_matrix = calculate_open_spot_matrix(
        collection: collection,
        moving_cards: moving_cards,
        drag_grid_spot: drag_grid_spot,
      )
      drag_map = determine_drag_map(
        master_card: master_card,
        moving_cards: moving_cards,
        from_collection: from_collection,
      )
      update_drag_grid_spot_with_open_position(
        card: master_card,
        position: placeholder,
        open_spot_matrix: open_spot_matrix,
        drag_grid_spot: drag_grid_spot,
      )
      debugger
      drag_map.each do |mapped|
        # TODO remove this position duplication
        position = Hashie::Mash.new(
          row: mapped.row,
          col: mapped.col,
          width: mapped.card.width,
          height: mapped.card.height,
        )
        open_spot_matrix = calculate_open_spot_matrix(
          collection: collection,
          moving_cards: moving_cards,
          drag_grid_spot: drag_grid_spot,
        )
        update_drag_grid_spot_with_open_position(
          card: mapped.card,
          position: position,
          open_spot_matrix: open_spot_matrix,
          drag_grid_spot: drag_grid_spot,
        )
      end
    end

    def self.find_closest_open_spot(placeholder, open_spot_matrix)
      row = placeholder.row
      col = placeholder.col
      width = placeholder.width
      height = placeholder.height

      possibilities = []
      exact_fit = false

      open_spot_matrix.each_with_index do |row_vals, row_idx|
        if row_idx >= row && row_idx <= row + 15
          row_vals.each_with_index do |open_spots, col_idx|
            can_fit = false
            if open_spots >= width
              if height > 1
                (height - 1).times do |i|
                  next_row = open_spot_matrix[row_idx + i + 1]
                  if next_row && next_row[col_idx] && next_row[col_idx] >= width
                    can_fit = true
                  end
                end
              else
                can_fit = true
              end
            end

            if can_fit
              row_diff = row_idx - row
              col_diff = col_idx - col
              if col_diff.negative?
                col_diff *= 1.01
              else
                col_diff *= 0.99
              end
              distance = Math.sqrt(row_diff * row_diff + col_diff * col_diff)
              exact_fit = distance.zero?
              possibilities.push(row: row_idx, col: col_idx, distance: distance)
            end
            if exact_fit || possibilities.size > 32
              break
            end
          end
        end
        if exact_fit || possibilities.size > 32
          break
        end
      end
      possibilities = possibilities.sort_by { |p| p[:distance] }
      closest = possibilities.first
      closest || false
    end

    def self.calculate_open_spot_matrix(
      collection:,
      moving_cards:,
      drag_grid_spot:
    )
      card_matrix = matrix_with_dragged_spots(
        collection: collection,
        drag_grid_spot: drag_grid_spot,
      )
      open_spot_matrix = [[]]

      card_matrix.each_with_index do |row, row_idx|
        open = 0
        open_spot_matrix[row_idx] = Array.new(16)
        reversed = row.reverse

        reversed.each_with_index do |card, col_idx|
          if card.present? && !moving_cards.pluck(:id).include?(card.id)
            open = 0
          else
            open += 1
          end
          open_spot_matrix[row_idx][15 - col_idx] = open
        end
      end
      open_spot_matrix
    end

    def self.matrix_with_dragged_spots(
      collection:,
      drag_grid_spot:
    )
      card_matrix = board_matrix(collection: collection)
      dragging_placeholders = drag_grid_spot.values
      debugger
      dragging_placeholders.each do |placeholder|
        max_row = placeholder.row + placeholder.height - 1
        max_col = placeholder.col + placeholder.width - 1
        rows = [placeholder.row..max_row]
        cols = [placeholder.col..max_col]

        rows.each do |row|
          cols.each do |col|
            card_matrix[row][col] = placeholder
          end
        end
      end
      card_matrix
    end
  end
end
