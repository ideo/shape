import { routingStore, uiStore } from '~/stores'

const archive = (type, obj) => {
  const onAgree = async () => {
    await obj.apiStore.request(`${type}/${obj.id}/archive`, 'PATCH')
    // NOTE: should we handle the redirect here, or in the PageMenu/etc?
    let redirect = '/'
    if (obj.breadcrumb.length >= 2) {
      const [klass, id] = obj.breadcrumb[obj.breadcrumb.length - 2]
      redirect = routingStore.pathTo(klass, id)
    }
    routingStore.push(redirect)
    uiStore.trackEvent('archive', obj)
  }

  uiStore.confirm({
    prompt: 'Are you sure you want to archive this?',
    confirmText: 'Archive',
    iconName: 'Archive',
    onConfirm: onAgree,
  })
}

const duplicate = async (type, obj) => {
  try {
    // this will duplicate the card into My Collection
    await obj.apiStore.request(`${type}/${obj.id}/duplicate`, 'POST')
    // send to My Collection to view created duplicate
    routingStore.routeTo('homepage')
    uiStore.alertOk('Your duplicate has been created in My Collection')
    uiStore.scroll.scrollToBottom()
  } catch (e) {
    uiStore.defaultAlertError()
  }
}

export default {
  archive,
  duplicate,
}
