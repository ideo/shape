import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { BrowserRouter } from 'react-router-dom'
import App from 'c-delta-organization-settings'
import IdeoSSO from '~/utils/IdeoSSO'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
  width: 700px;
`

@inject('apiStore', 'uiStore')
@observer
class OrgSettings extends React.Component {
  // TODO: FIX NAMESPACE BECAUSE WE ALREADY HAVE
  // ~/ui/organizations/OrganizationSettings.js
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
        <BrowserRouter basename={'/org-settings'}>
          <App
            logout={() => IdeoSSO.logout('/login')}
            login={() => IdeoSSO.signIn()}
            profileUrl={IdeoSSO.profileUrl}
          />
        </BrowserRouter>
      </SettingsPageWrapper>
    )
  }
}

OrgSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettings
