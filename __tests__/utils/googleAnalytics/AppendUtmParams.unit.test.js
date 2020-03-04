import AppendUtmParams from '~/utils/googleAnalytics/AppendUtmParams'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { getStoredUtmParams } from '~/utils/googleAnalytics/utmUtils'

jest.mock('../../../app/javascript/utils/googleAnalytics/utmUtils')

let props, render
describe('AppendUtmParams', () => {
  beforeEach(() => {
    props = { routingStore: fakeRoutingStore }
    render = () => {
      shallow(<AppendUtmParams.wrappedComponent {...props} />)
    }
  })

  describe('appendParamsToUrl', () => {
    describe('with no utm params on url', () => {
      beforeEach(() => {
        props.routingStore.utmQueryParams = {}
        render()
      })

      it('calls routingStore.appendQueryString()', () => {
        expect(fakeRoutingStore.appendQueryString).toHaveBeenCalledWith(
          getStoredUtmParams()
        )
      })
    })

    describe('with utm params on url', () => {
      beforeEach(() => {
        props.routingStore.appendQueryString.mockClear()
        props.routingStore.utmQueryParams = {
          utm_campaign: 'some-existing-param',
        }
        render()
      })

      it('does not call routingStore.appendQueryString()', () => {
        expect(fakeRoutingStore.appendQueryString).not.toHaveBeenCalled()
      })
    })
  })
})
