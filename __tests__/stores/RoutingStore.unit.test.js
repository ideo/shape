import RoutingStore from '~/stores/RoutingStore'
import { storeUtmParams } from '~/utils/googleAnalytics/utmUtils'

jest.mock('../../app/javascript/utils/googleAnalytics/utmUtils')

let routingStore
describe('RoutingStore', () => {
  beforeEach(() => {
    // reset every time
    routingStore = new RoutingStore()
  })
  describe('routeToLogin', () => {
    const { location } = window

    beforeAll(() => {
      // Define window.location so jest doesn't complain (Not implemented: navigation)
      delete window.location
      window.location = { reload: jest.fn() }
    })

    afterAll(() => {
      window.location = location
    })

    it('stores UTM params', () => {
      routingStore.routeToLogin({})
      expect(storeUtmParams).toHaveBeenCalledWith(routingStore.utmQueryParams)
    })
  })
})
