import queryString from 'query-string'
import Cookies from 'js-cookie'

const utmParamsCookieName = 'utmParams'

// This stores an object {} with given params in a cookie as a query string
// UTM Params are available on the RoutingStore#utmQueryParams
export const storeUtmParams = utmParams => {
  const hasUtmParamValues = Object.values(utmParams).some(param => !!param)
  // If there aren't any utm params in URL, return
  if (hasUtmParamValues) {
    Cookies.set(utmParamsCookieName, queryString.stringify(utmParams), {
      expires: 7,
    })
  }
}

// This returns stored UTM Params as a query string
export const getStoredUtmParams = () => Cookies.get(utmParamsCookieName)

export const deleteUtmParams = () => Cookies.remove(utmParamsCookieName)

export const utmParamsFromLocation = location => {
  const values = queryString.parse(location.search)
  // Extract utm parameters we support
  const { utm_source, utm_medium, utm_campaign, utm_content } = values
  return {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  }
}
