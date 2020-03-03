export const storeUtmParams = jest.fn()

export const getStoredUtmParams = jest
  .fn()
  .mockReturnValue('?utm_campaign=test-campaign-1')

export const utmParamsFromLocation = jest
  .fn()
  .mockReturnValue({ utm_campaign: 'test-campaign-1' })
