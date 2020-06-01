import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import OverdueClockIcon from '~/ui/icons/OverdueClockIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import Banner from '~/ui/layout/Banner'

const StyledIconWrapper = styled.div`
  width: ${props => props.width || props.height || '32'}px;
  height: ${props => props.height || props.width || '32'}px;
`

const StyledClickableIconWrapper = styled(StyledIconWrapper)`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

@inject('apiStore', 'uiStore')
@observer
class OverdueBanner extends React.Component {
  hide = () => this.props.uiStore.hideOverdueBanner()

  get overdueMessage() {
    const { currentOrganization } = this
    return `${currentOrganization.name} account is overdue. Your content will become inaccessible on ${currentOrganization.inaccessible_at}.`
  }

  renderLeftComponent() {
    return (
      <Grid container>
        <Grid item xs={1}>
          <StyledIconWrapper>
            <OverdueClockIcon />
          </StyledIconWrapper>
        </Grid>
        <Grid item xs={11}>
          {this.overdueMessage}
        </Grid>
      </Grid>
    )
  }

  renderRightComponent() {
    const userCanEdit = this.currentOrganization.primary_group.can_edit

    return userCanEdit ? (
      <div>
        Add payment method <Link to="/billing">here.</Link>
      </div>
    ) : (
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item>Contact your admin for assistance.</Grid>
        <Grid item>
          <StyledClickableIconWrapper onClick={this.hide}>
            <CloseIcon />
          </StyledClickableIconWrapper>
        </Grid>
      </Grid>
    )
  }

  get currentOrganization() {
    const { apiStore } = this.props

    return apiStore.currentUser
      ? apiStore.currentUser.current_organization
      : null
  }

  get hideOverdueBanner() {
    const { currentOrganization } = this

    return (
      !currentOrganization ||
      !this.props.uiStore.overdueBannerVisible ||
      currentOrganization.deactivated ||
      !currentOrganization.overdue ||
      !currentOrganization.in_app_billing
    )
  }

  render() {
    if (this.hideOverdueBanner) return null

    return (
      <Banner
        leftComponent={this.renderLeftComponent()}
        rightComponent={this.renderRightComponent()}
      />
    )
  }
}

OverdueBanner.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OverdueBanner
