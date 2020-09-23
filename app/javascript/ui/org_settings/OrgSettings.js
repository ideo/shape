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
  constructor(props) {
    super(props)
  }

  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  get sendToLogin() {
    window.location = '/login?redirect=/user_settings'
  }

  get startingTab() {
    const { match } = this.props
    if (match.params && match.params.tab) {
      return match.params.tab
    }

    return 'organization'
  }

  render() {
    if (!this.user) this.sendToLogin()

    return (
      <SettingsPageWrapper>
        <CreativeDifferenceTabs
          tab={this.startingTab}
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
  // TODO: figure out why this error keeps happening. It's not a function!
  // Failed prop type: inject-OrgSettings-with-apiStore-uiStore: prop type `match` is invalid; it must be a function, usually from the `prop-types` package, but received `undefined`.
}

OrgSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettings
