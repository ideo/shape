import { utmParamsFromLocation } from '~/utils/googleAnalytics/utmUtils'

describe('utmUtils', () => {
  describe('utmParamsFromLocation', () => {
    it('returns utm variables from query string', () => {
      const location = {
        search:
          '?utm_source=facebook&utm_campaign=test-campaign-1&utm_content=test&utm_medium=mobile',
      }
      expect(utmParamsFromLocation(location)).toEqual({
        utm_source: 'facebook',
        utm_campaign: 'test-campaign-1',
        utm_content: 'test',
        utm_medium: 'mobile',
      })
    })
  })
})
