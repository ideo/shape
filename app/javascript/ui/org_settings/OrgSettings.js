import {
  inject,
  observer,
  PropTypes as MobxPropTypes,
  PropTypes,
} from 'mobx-react'
import styled from 'styled-components'

import CreativeDifferenceTabs from './CreativeDifferenceTabs'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
  ${'' /* width: 700px; */}
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
    const { match } = this.props
    const tab = match.params.tab ? match.params.tab : 'organization'

    return (
      <SettingsPageWrapper>
        <CreativeDifferenceTabs
          tab={tab}
          orgName={this.props.apiStore.currentUserOrganizationName}
        />
      </SettingsPageWrapper>
    )
  }
}

OrgSettings.defaultProps = {
  match: {},
}
OrgSettings.propTypes = {
  match: PropTypes.object,
}

OrgSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettings
