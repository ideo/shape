import { routingStore } from '~/stores'

export const archive = (type, obj) => {
  // eslint-disable-next-line no-alert
  const agree = window.confirm('Are you sure?')
  if (agree) {
    return obj.apiStore.request(`${type}/${obj.id}/archive`, 'PATCH').then(() => {
      // NOTE: should we handle the redirect here, or in the PageMenu/etc?
      let redirect = '/'
      if (obj.breadcrumb.length >= 2) {
        const [klass, id] = obj.breadcrumb[obj.breadcrumb.length - 2]
        redirect = routingStore.pathTo(klass, id)
      }
      routingStore.push(redirect)
    })
  }
  return false
}

export default {
  archive
}
