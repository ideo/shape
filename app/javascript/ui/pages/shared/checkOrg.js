import { apiStore, routingStore } from '~/stores'

const checkOrg = match => {
  // if we're already mid-switch don't start another one
  if (apiStore.switchingOrgs) return true

  const { org } = match.params
  let path = `${routingStore.location.pathname}${routingStore.location.search}`

  if (
    match.path !== '/' &&
    match.path !== '/:org' &&
    !match.path.match(/^(\/:org)?\/collections|items|search/gi)
  ) {
    // escape if we're not on homepage, search, or /collections/items
    return true
  }

  if (match.path !== '/' && !apiStore.currentOrgSlug) {
    // no org available, e.g. we need to set up a new org
    routingStore.routeTo('/')
    return false
  }
  if (!org) {
    routingStore.routeTo(`/${apiStore.currentOrgSlug}${path}`)
    return false
  } else if (org !== apiStore.currentOrgSlug) {
    // remove any "wrong" org from the path
    if (match.path.indexOf('/:org') === 0) {
      path = path.replace(/^(\/[\w-]*)/, '') || 'homepage'
    }

    apiStore.currentUser.switchOrganization(org, {
      redirectPath: path,
    })
    return false
  }
  return true
}

export default checkOrg
