import _ from 'lodash'

export const groupByConsecutive = (array, value) => {
  const groups = []
  let buffer = []
  for (let i = 0; i < array.length; i += 1) {
    const curItem = array[i]
    if (curItem === value) {
      buffer.push(i)
    } else if (buffer.length > 0) {
      groups.push(buffer)
      buffer = []
    }
  }
  if (buffer.length > 0) groups.push(buffer)
  return groups
}

export const findTopLeftCard = cards => {
  const minRow = _.minBy(cards, 'row').row
  const minRowCards = _.filter(cards, { row: minRow })
  return _.minBy(minRowCards, 'col')
}

export const findBottomRowCards = cards => {
  return _.uniqBy(_.orderBy(cards, ['row', 'col'], ['desc', 'asc']), 'col')
}

// calculate row/col of these cards as if they were in a 4-column grid sequentially
export const calculateRowsCols = (
  cards,
  { sortByOrder = true, apply = false, prefilled = 0 } = {}
) => {
  let row = 0
  const matrix = []
  const cols = 4
  // create an empty row
  matrix.push(_.fill(Array(cols), null))
  if (prefilled > 0) {
    _.fill(matrix[0], 'prefilled', 0, prefilled)
  }
  let sortedCards = [...cards]
  if (sortByOrder) {
    // e.g. for search results we don't want to re-sort the cards
    sortedCards = _.sortBy(cards, 'order')
  }

  _.each(sortedCards, (card, i) => {
    let filled = false
    while (!filled && row < 500) {
      let { width, height } = card
      if (!width) width = 1
      if (!height) height = 1
      // go through the row and see if there is an empty gap that fits cardWidth
      const gaps = groupByConsecutive(matrix[row], null)
      const maxGap = _.find(gaps, g => g.length >= width) || {
        length: 0,
      }

      if (maxGap && maxGap.length) {
        const [nextX] = maxGap
        filled = true
        const position = {
          x: nextX,
          y: row,
        }
        if (apply) {
          card.row = row
          card.col = nextX
        }
        card.position = position

        // fill rows and columns
        _.fill(matrix[row], card.id, position.x, position.x + width)
        for (let y = 1; y < height; y += 1) {
          if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
          _.fill(matrix[row + y], card.id, position.x, position.x + width)
        }

        if (_.last(matrix[row]) === card.id) {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      } else {
        row += 1
        if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
      }
    }
  })
  return sortedCards
}

export const findClosestOpenSpot = (
  placeholder,
  openSpotMatrix,
  numColumns
) => {
  const { row, col, height, width } = placeholder

  let possibilities = []
  let exactFit = false

  _.each(openSpotMatrix, (rowVals, rowIdx) => {
    if (rowIdx >= row && rowIdx <= row + numColumns - 1) {
      _.each(rowVals, (openSpots, colIdx) => {
        let canFit = false
        if (openSpots >= width) {
          if (height > 1) {
            _.times(height - 1, i => {
              const nextRow = openSpotMatrix[rowIdx + i + 1]
              if (nextRow && nextRow[colIdx] && nextRow[colIdx] >= width) {
                canFit = true
              }
            })
          } else {
            canFit = true
          }
        }

        if (canFit) {
          const rowDiff = rowIdx - row
          let colDiff = colIdx - col
          // pythagorean distance + weighted towards the right
          if (colDiff < 0) {
            colDiff *= 1.01
          } else {
            colDiff *= 0.99
          }
          let distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff)

          if (rowDiff > 0) {
            distance = Math.abs(
              rowIdx * numColumns + colIdx - (row * numColumns + col)
            )
          }

          exactFit = distance === 0
          possibilities.push({ row: rowIdx, col: colIdx, distance })
        }
        if (exactFit || possibilities.length > 32) {
          // exit loop
          return false
        }
      })
    }
    if (exactFit || possibilities.length > 32) {
      // exit loop
      return false
    }
  })

  possibilities = _.sortBy(possibilities, 'distance')
  const closest = possibilities[0]
  return closest || false
}

const matrixWithDraggedSpots = (collection, dragGridSpot) => {
  const cardMatrix = [...collection.cardMatrix]

  const draggingPlaceholders = [...dragGridSpot.values()]
  _.each(draggingPlaceholders, placeholder => {
    const maxRow = placeholder.row + placeholder.height
    const maxCol = placeholder.col + placeholder.width
    const rows = _.range(placeholder.row, maxRow)
    const cols = _.range(placeholder.col, maxCol)

    // Iterate over each to populate the matrix
    _.each(rows, row => {
      _.each(cols, col => {
        cardMatrix[row][col] = placeholder
      })
    })
  })

  return cardMatrix
}

/*
 * The drag matrix is an array of arrays (like the cardMatrix) that simply represents
 * the number of open spots to the right of any particular coordinate (row/col)
 * e.g.
 * [2, 1, 0, 0, 5...]
 * [10, 9, 8, 7, 6...]
 */
export const calculateOpenSpotMatrix = ({
  collection,
  multiMoveCardIds = [],
  dragGridSpot = null,
  withDraggedSpots = false,
  takenSpots = [],
  maxVisibleRow = null,
} = {}) => {
  const cardMatrix = withDraggedSpots
    ? matrixWithDraggedSpots(collection, dragGridSpot)
    : collection.cardMatrix
  const columnCount = collection.num_columns

  if (!columnCount) return [[]]

  // initialize open spot matrix
  const openSpotMatrix = _.map(Array(maxVisibleRow), () => {
    return _.fill(new Array(columnCount))
  })

  // mark spots beyond the last row with cards as not taken
  const firstRowWithNoCards = cardMatrix.length
  if (maxVisibleRow && maxVisibleRow > firstRowWithNoCards - 1) {
    const openRows = _.rangeRight(1, columnCount + 1)
    for (let rowIdx = firstRowWithNoCards; rowIdx < maxVisibleRow; rowIdx++) {
      openSpotMatrix[rowIdx] = openRows
    }
  }

  // check every collection card in the card matrix to mark spot as open
  _.each(cardMatrix, (row, rowIdx) => {
    let open = 0
    const reversed = _.reverse(row)
    _.each(reversed, (card, colIdx) => {
      if (card && !_.includes(multiMoveCardIds, card.id)) {
        open = 0
      } else {
        open += 1
      }
      if (openSpotMatrix[rowIdx]) {
        openSpotMatrix[rowIdx][columnCount - 1 - colIdx] = open
      }
    })
  })

  // override card matrix spots that are now taken
  _.each(takenSpots, spot => {
    if (openSpotMatrix[spot.row]) {
      openSpotMatrix[spot.row][spot.col] = 'taken'
    }
  })

  return openSpotMatrix
}

/*
 * Calculates inner matrix from the supplied matrix based on a range of rows and cols
 */
export const calculateMatrixFromRange = (
  collection,
  { minRow, maxRow, minCol, maxCol }
) => {
  const { cardMatrix } = collection
  const rowRange = _.range(minRow, maxRow)
  const colRange = _.range(minCol, maxCol)

  return _.map(rowRange, row =>
    _.map(colRange, col => {
      return cardMatrix[row][col]
    })
  )
}
