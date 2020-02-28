import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import MenuItem from '@material-ui/core/MenuItem'
import styled from 'styled-components'
import v from '~/utils/variables'

import {
  Label,
  LabelText,
  LabelHint,
  Select,
  Checkbox,
} from '~/ui/global/styled/forms'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
  width: 700px;
`

const StyledLabelText = styled(LabelText)`
  margin: 15px 0px 0px 0px;
  text-transform: none;
  font-weight: normal;
`

const StyledCheckbox = styled(Checkbox)`
  place-self: flex-start;
`

@inject('apiStore', 'uiStore')
@observer
class UserSettings extends React.Component {
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

  handleAddToMyCollectionCheck = async ev => {
    const addToMyCollectionChecked = ev.target.checked
    v.useTemplateSettings.addToMyCollection
    const useTemplateSetting = addToMyCollectionChecked
      ? v.useTemplateSettings.addToMyCollection
      : v.useTemplateSettings.letMePlaceIt
    this.user.use_template_setting = useTemplateSetting
    await this.user.API_updateUseTemplateSetting(useTemplateSetting)
  }

  get notifyValue() {
    if (!this.user) return 'off'
    return this.user.notify_through_email ? 'on' : 'off'
  }

  get sendToLogin() {
    window.location = '/login?redirect=/user_settings'
  }

  render() {
    if (!this.user) this.sendToLogin()

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
                  <StyledLabelText>
                    {v.userSettingsLabels.mailingListText}
                  </StyledLabelText>
                  <LabelHint>{v.userSettingsLabels.mailingListHint}</LabelHint>
                </div>
              }
            />
          </FormControl>
        </div>

        <div>
          <FormControl component="fieldset">
            <FormControlLabel
              classes={{ label: 'form-control' }}
              control={
                <StyledCheckbox
                  checked={
                    this.user.use_template_setting ===
                    v.useTemplateSettings.addToMyCollection
                  }
                  onChange={this.handleAddToMyCollectionCheck}
                  value="yes"
                />
              }
              label={
                <div>
                  <StyledLabelText>
                    {v.userSettingsLabels.useTemplateLabel}
                  </StyledLabelText>
                  <LabelHint>{v.userSettingsLabels.useTemplateHint}</LabelHint>
                </div>
              }
            />
          </FormControl>
        </div>
      </SettingsPageWrapper>
    )
  }
}

UserSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default UserSettings
