import _ from 'lodash'
import {
  calculateRowsCols,
  calculateOpenSpotMatrix,
} from '~/utils/CollectionGridCalculator'

describe('calculateOpenSpotMatrix', () => {
  let cardMatrix = [[]]
  let fakeCollection = {}
  const num_columns = 4

  beforeEach(() => {
    cardMatrix = [
      [
        { id: 1, row: 0, col: 0 },
        null,
        { id: 2, row: 0, col: 2 },
        { id: 3, row: 0, col: 3 },
      ],
      [null, { id: 4, row: 1, col: 1 }, { id: 5, row: 1, col: 2 }, null],
      [
        { id: 6, row: 2, col: 0 },
        { id: 7, row: 2, col: 1 },
        { id: 8, row: 2, col: 2 },
        null,
      ],
    ]

    fakeCollection = {
      cardMatrix,
      num_columns,
    }
  })

  describe('with collection', () => {
    it('should calculate open spots given a collection card matrix', () => {
      expect(calculateOpenSpotMatrix({ collection: fakeCollection })).toEqual([
        [0, 1, 0, 0],
        [1, 0, 0, 1],
        [0, 0, 0, 1],
      ])
    })
  })

  describe('with takenSpots', () => {
    it('should calculate open spots given a collection card matrix', () => {
      const takenSpots = [{ row: 0, col: 1 }, { row: 2, col: 3 }]
      expect(
        calculateOpenSpotMatrix({
          collection: fakeCollection,
          takenSpots,
        })
      ).toEqual([[0, 0, 0, 0], [1, 0, 0, 1], [0, 0, 0, 0]])
    })
  })
})

describe('calculateRowsCols', () => {
  it('should calculate the 4 column layout of the given cards', () => {
    const cards = [
      { order: 0, width: 1, height: 1 },
      { order: 3, width: 2, height: 2 },
      { order: 6, width: 1, height: 2 },
      { order: 7, width: 1, height: 1 },
      { order: 8, width: 3, height: 1 },
      { order: 9, width: 2, height: 1 },
      { order: 10, width: 2, height: 2 },
      { order: 11, width: 1, height: 1 },
    ]

    expect(_.map(calculateRowsCols(cards), 'position')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 0, y: 4 },
    ])
  })
})
