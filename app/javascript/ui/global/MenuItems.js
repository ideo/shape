import { apiStore, routingStore } from '~/stores'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import LeaveIcon from '~/ui/icons/LeaveIcon'

const CONTEXT_USER = 'user'
const CONTEXT_ORG = 'org'
const CONTEXT_COMBO = 'combo'

export const generateUserMenu = options => generate(CONTEXT_USER, options)
export const generateOrgMenu = options => generate(CONTEXT_ORG, options)
export const generateComboMenu = options => generate(CONTEXT_COMBO, options)

export function generate(context, options = {}) {
  const onItemClickWrapper = cb => e => {
    cb(e)
    options.onItemClick && options.onItemClick(e)
  }

  const menuItems = []

  if (context === CONTEXT_USER) {
    menuItems.push(...userMenuItems())
  } else if (context === CONTEXT_ORG) {
    menuItems.push(...orgMenuItems())
  } else {
    // context === CONTEXT_COMBO
    menuItems.push(...orgMenuItems())
    menuItems.push(...userMenuItems())
  }

  return menuItems.map(item => {
    if (item.onClick) {
      item.onClick = onItemClickWrapper(item.onClick)
    }
    return item
  })
}

const orgMenuItems = itemClick => {
  const items = []
  return items
}

const userMenuItems = itemClick => {
  const items = [
    {
      name: 'Account Settings',
      icon: <SettingsIcon />,
      onClick: () => {
        window.open(IdeoSSO.profileUrl, '_blank')
      },
    },
    {
      name: 'Notification Settings',
      icon: <SettingsIcon />,
      onClick: () => {
        routingStore.routeTo('/user_settings')
      },
    },
    {
      name: 'Logout',
      icon: <LeaveIcon />,
      onClick: () => {
        apiStore.currentUser.logout()
      },
    },
  ]
  if (apiStore.currentUser.user_profile_collection_id) {
    items.unshift({
      name: 'My Profile',
      icon: <ProfileIcon />,
      onClick: () => {
        routingStore.routeTo(
          'collections',
          apiStore.currentUser.user_profile_collection_id
        )
      },
    })
  }
  return items
}
