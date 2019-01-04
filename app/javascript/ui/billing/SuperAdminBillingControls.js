import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Grid, Switch } from '@material-ui/core'
import Box from '~shared/components/atoms/Box'
import trackError from '~/utils/trackError'
import apiSaveModel from '~/utils/apiSaveModel'

const Wrapper = styled.div`
  font-family: 'Gotham';
  background: #3f526a;
  color: white;
  text-transform: uppercase;
`

const Title = styled.div`
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0;
`

@inject('apiStore', 'networkStore')
@observer
class SuperAdminBillingControls extends React.Component {
  @observable
  changingInAppBilling = false

  changeOrganizationInAppBilling = async () => {
    const { currentUserOrganization } = this.props.apiStore
    currentUserOrganization.in_app_billing = !currentUserOrganization.in_app_billing
    try {
      runInAction(() => (this.changingInAppBilling = true))
      await apiSaveModel(currentUserOrganization)
      runInAction(() => (this.changingInAppBilling = false))
    } catch (e) {
      trackError(e)
      runInAction(() => (this.changingInAppBilling = false))
    }
  }

  render() {
    const {
      currentUser: { is_super_admin: isSuperAdmin },
      currentUserOrganization,
    } = this.props.apiStore

    if (!isSuperAdmin) {
      return null
    }

    return (
      <Wrapper>
        <Box px={36} py={24}>
          <Grid container justify="space-between" alignItems="center">
            <Grid item xs={9}>
              <Title>super admin controls</Title>
            </Grid>
            <Grid item xs={3}>
              in-app billing
              <Switch
                disabled={this.changingInAppBilling}
                checked={currentUserOrganization.in_app_billing}
                onChange={this.changeOrganizationInAppBilling}
              />
              {currentUserOrganization.in_app_billing ? 'on' : 'off'}
            </Grid>
          </Grid>
        </Box>
      </Wrapper>
    )
  }
}

SuperAdminBillingControls.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SuperAdminBillingControls
