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

// calculate row/col of these cards as if they were in a 4-column grid sequentially
export const calculateRowsCols = cards => {
  let row = 0
  const matrix = []
  const cols = 4
  // create an empty row
  matrix.push(_.fill(Array(cols), null))
  const sortedCards = _.sortBy(cards, 'order')

  _.each(sortedCards, (card, i) => {
    let filled = false
    while (!filled) {
      const { width, height } = card
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
