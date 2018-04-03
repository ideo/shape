import { routingStore, uiStore } from '~/stores'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'

export const archive = (type, obj) => {
  const onAgree = () =>
    obj.apiStore.request(`${type}/${obj.id}/archive`, 'PATCH').then(() => {
      // NOTE: should we handle the redirect here, or in the PageMenu/etc?
      let redirect = '/'
      if (obj.breadcrumb.length >= 2) {
        const [klass, id] = obj.breadcrumb[obj.breadcrumb.length - 2]
        redirect = routingStore.pathTo(klass, id)
      }
      routingStore.push(redirect)
    })

  uiStore.openAlertModal({
    prompt: 'Are you sure you want to archive this?',
    confirmText: 'Archive',
    icon: <ArchiveIcon />,
    onConfirm: onAgree,
  })
}

export default {
  archive
}
