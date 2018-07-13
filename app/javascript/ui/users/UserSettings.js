import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Heading2 } from '~/ui/global/styled/typography'
import MenuItem from '@material-ui/core/MenuItem'
import { Label, Select } from '~/ui/global/styled/forms'

@inject('apiStore', 'uiStore')
@observer
class OrganizationSettings extends React.Component {
  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  handleEmailNotifications = (ev) => {
    ev.preventDefault()
    const val = !!(ev.target.value === 'on')
    if (!val) {
      const { uiStore } = this.props
      uiStore.confirm({
        prompt: 'Are you sure? You will no longer get email updates when you are added to content or mentioned in comments.',
        confirmText: 'Turn off',
        onConfirm: () => this.user.API_updateCurrentUser({ notify_through_email: val })
      })
    } else {
      this.user.API_updateCurrentUser({ notify_through_email: val })
    }
  }

  get value() {
    return this.user.notify_through_email ? 'on' : 'off'
  }

  render() {
    return (
      <div>
        <Heading2>Notifications</Heading2>
        <Label style={{ display: 'inline-block', marginRight: '25px' }}>
          Email notifications
        </Label>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="email_notifications"
          onChange={this.handleEmailNotifications}
          value={this.value}
        >
          <MenuItem key="on" value="on">
            On
          </MenuItem>
          <MenuItem key="off" value="off">
            Off
          </MenuItem>
        </Select>
      </div>
    )
  }
}

OrganizationSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
