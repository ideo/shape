import { CaptureUtmParams } from '~/utils/googleAnalytics/CaptureUtmParams'
import { storeUtmParams } from '~/utils/googleAnalytics/utmUtils'

jest.mock('../../../app/javascript/utils/googleAnalytics/utmUtils')

let props, render
describe('CaptureUtmParams', () => {
  beforeEach(() => {
    props = {
      location: {
        search: '?utm_campaign=test-campaign-1',
        hash: '',
        pathname: '/ideo',
      },
    }
    render = () => {
      shallow(<CaptureUtmParams {...props} />)
    }
    render()
  })

  it('calls storeUtmParams', () => {
    expect(storeUtmParams).toHaveBeenCalledWith({
      utm_campaign: 'test-campaign-1',
    })
  })
})
