import routeToLogin from '~/utils/routeToLogin'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { storeUtmParams } from '~/utils/googleAnalytics/utmUtils'

jest.mock('../../app/javascript/stores')
jest.mock('../../app/javascript/utils/googleAnalytics/utmUtils')

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
    routeToLogin({})
    expect(storeUtmParams).toHaveBeenCalledWith(fakeRoutingStore.utmQueryParams)
  })
})
