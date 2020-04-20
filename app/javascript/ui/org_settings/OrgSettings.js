import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { usersStore, businessUnitsStore } from 'c-delta-organization-settings'
import { runInAction, observable } from 'mobx'

import CreativeDifferenceTabs from './CreativeDifferenceTabs'

const SettingsPageWrapper = styled.div`
  margin-top: 40px;
  width: 700px;
`

@inject('apiStore', 'uiStore')
@observer
class OrgSettings extends React.Component {
  @observable cDeltaUser = null
  @observable businessUnits = []

  async componentDidMount() {
    console.log('component did mount')
    const user = await this.cDeltaUser()
    const businessUnits = await this.businessUnits()
    runInAction(() => {
      this.cDeltaUser = user
      this.businessUnits = businessUnits
    })
    console.log('end component did mount')
  }

  get user() {
    const { apiStore } = this.props
    return apiStore.currentUser
  }

  cDeltaUser = async () => {
    const model = new usersStore.model()
    const user = new model()
    user.set({ id: 'me' })
    console.log(user)
    try {
      console.log('fetching user')
      const response = await user.fetch()
      console.log('User response: ', response)
    } catch (err) {
      console.log('request failed: ', err)
    }
  }

  businessUnits = async () => {
    console.log('fetching BUs')
    try {
      const response = await businessUnitsStore.fetch()
      console.log('BU response: ', response)
    } catch (err) {
      console.log('failed to fetch BUs: ', err)
    }
  }

  get sendToLogin() {
    window.location = '/login?redirect=/user_settings'
  }

  render() {
    if (!this.user) this.sendToLogin()
    // Should we fetch in the individual tabs instead of up here?
    console.log('in render', this.cDeltaUser, this.businessUnits)
    return (
      <SettingsPageWrapper>
        <CreativeDifferenceTabs tab={'teams'} />
      </SettingsPageWrapper>
    )
  }
}

OrgSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrgSettings
