import Audience from '~/stores/jsonApi/Audience'
import fakeApiStore from '#/mocks/fakeApiStore'

const audienceAttributes = {
  name: 'Vegan Millenials',
  min_price_per_response: 4.0,
}

let audience
const apiStore = fakeApiStore()
const { uiStore } = apiStore
beforeEach(() => {
  apiStore.request.mockClear()
  uiStore.addNewCard.mockClear()
  audience = new Audience(audienceAttributes, apiStore)
})

describe('Audience', () => {
  describe('pricePerResponse', () => {
    it('returns price for given number of questions', () => {
      // $4.00 + ((43 - 10) x $0.12) = $7.96
      expect(audience.pricePerResponse(43)).toEqual(7.96)

      // Given minimum or less than minimum questions, return baseline
      // $4.00 + (0 x $0.12) = $4.00
      expect(audience.pricePerResponse(10)).toEqual(4)
      expect(audience.pricePerResponse(5)).toEqual(4)
    })

    describe('If link sharing', () => {
      beforeEach(() => {
        audience.min_price_per_response = 0
        audience.global_default = 1
      })

      it('returns 0', () => {
        expect(audience.pricePerResponse(10)).toEqual(0)
      })
    })
  })
})
