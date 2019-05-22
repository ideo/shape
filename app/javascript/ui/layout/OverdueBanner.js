import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import OverdueClockIcon from '~/ui/icons/OverdueClockIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import Banner from '~/ui/layout/Banner'
import v from '~/utils/variables'

@inject('apiStore', 'uiStore')
@observer
class OverdueBanner extends React.Component {
  hide = () => this.props.uiStore.hideOverdueBanner()

  renderLeftComponent() {
    const currentOrganization = this

    return (
      <React.Fragment>
        <Grid item xs={1}>
          <StyledIconWrapper>
            <OverdueClockIcon />
          </StyledIconWrapper>
        </Grid>
        <Grid item xs={11}>
          {currentOrganization.name} account is overdue. Your content will
          become inaccessible on {currentOrganization.inaccessible_at}.
        </Grid>
      </React.Fragment>
    )
  }

  renderRightComponent() {
    const userCanEdit = this.currentOrganization.primary_group.can_edit

    return userCanEdit ? (
      <div>
        Add payment method <Link to="/billing">here.</Link>
      </div>
    ) : (
      <Grid container spacing={16} alignItems="flex-end">
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

    apiStore.currentUser ? apiStore.currentUser.current_organization : null

    if (!apiStore.currentUser) return null

    return apiStore.currentUser.current_organization
  }

  get hideOverdueBanner() {
    const currentOrganization = this

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
      <StyledBanner
        backgroundColor={v.colors.alert}
        leftComponent={this.renderLeftComponent()}
        rightComponent={this.renderRightComponent()}
      />
    )
  }
}

const StyledBanner = styled(Banner)`
  margin-left: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-right: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-top: 20px;
  margin-bottom: 20px;

  @media only screen and (max-width: ${v.maxWidth +
      v.containerPadding.horizontal * v.fonts.baseSize}px) {
    margin-left: -${v.containerPadding.horizontal}rem;
    margin-right: -${v.containerPadding.horizontal}rem;
    padding: 20px ${v.containerPadding.horizontal}rem;
  }
`

OverdueBanner.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

const StyledIconWrapper = styled.div`
  width: ${props => props.width || props.height || '32'}px;
  height: ${props => props.height || props.width || '32'}px;
`

const StyledClickableIconWrapper = styled(StyledIconWrapper)`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

export default OverdueBanner
