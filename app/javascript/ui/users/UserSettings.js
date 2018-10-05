import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import MenuItem from '@material-ui/core/MenuItem'
import styled from 'styled-components'

import { Label, LabelText, Select, Checkbox } from '~/ui/global/styled/forms'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
`

@inject('apiStore', 'uiStore')
@observer
class OrganizationSettings extends React.Component {
  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  handleEmailNotifications = ev => {
    ev.preventDefault()
    const val = !!(ev.target.value === 'on')
    if (!val) {
      const { uiStore } = this.props
      uiStore.confirm({
        prompt:
          'Are you sure? You will no longer get email updates when you are added to content or mentioned in comments.',
        confirmText: 'Turn off',
        onConfirm: () =>
          this.user.API_updateCurrentUser({ notify_through_email: val }),
      })
    } else {
      this.user.API_updateCurrentUser({ notify_through_email: val })
    }
  }

  handleMailingListCheck = async ev => {
    const { uiStore } = this.props
    const mailing_list = ev.target.checked
    this.user.mailing_list = mailing_list
    await this.user.API_updateCurrentUser({ mailing_list })
    let message
    if (mailing_list) {
      message = 'You have been added to the mailing list'
    } else {
      message = 'You have been removed from the mailing list'
    }
    uiStore.alert(message, 'Mail')
  }

  get notifyValue() {
    return this.user.notify_through_email ? 'on' : 'off'
  }

  render() {
    return (
      <SettingsPageWrapper>
        <Label style={{ display: 'inline-block', marginRight: '25px' }}>
          Email notifications
        </Label>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="email_notifications"
          onChange={this.handleEmailNotifications}
          value={this.notifyValue}
        >
          <MenuItem key="on" value="on">
            On
          </MenuItem>
          <MenuItem key="off" value="off">
            Off
          </MenuItem>
        </Select>

        <div>
          <FormControl component="fieldset">
            <FormControlLabel
              classes={{ label: 'form-control' }}
              control={
                <Checkbox
                  checked={this.user.mailing_list}
                  onChange={this.handleMailingListCheck}
                  value="yes"
                />
              }
              label={
                <div>
                  <LabelText
                    style={{ display: 'block', marginTop: 15, marginBottom: 0 }}
                  >
                    Mailing List
                  </LabelText>
                  Stay current on new features and case studies by signing up
                  for our mailing list
                </div>
              }
            />
          </FormControl>
        </div>
      </SettingsPageWrapper>
    )
  }
}

OrganizationSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
