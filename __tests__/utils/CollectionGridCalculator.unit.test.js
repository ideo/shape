import _ from 'lodash'
import { calculateRowsCols } from '~/utils/CollectionGridCalculator'

describe('calculateRowsCols', () => {
  it('should calculate the 4 column layout of the given cards', () => {
    const cards = [
      { order: 0, width: 1, height: 1 },
      { order: 3, width: 2, height: 2 },
      { order: 6, width: 1, height: 2 },
      { order: 7, width: 1, height: 1 },
      { order: 8, width: 3, height: 1 },
      { order: 8, width: 2, height: 1 },
    ]

    expect(_.map(calculateRowsCols(cards), 'position')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ])
  })
})
