import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CreativeDifferenceTabs from './CreativeDifferenceTabs'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
  width: 700px;
`

@inject('apiStore', 'uiStore')
@observer
class OrgSettings extends React.Component {
  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  get sendToLogin() {
    window.location = '/login?redirect=/user_settings'
  }

  render() {
    if (!this.user) this.sendToLogin()

    return (
      <SettingsPageWrapper>
        <CreativeDifferenceTabs
          orgName={this.props.apiStore.currentUserOrganizationName}
        />
      </SettingsPageWrapper>
    )
  }
}

OrgSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettings
