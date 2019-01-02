import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import OverdueClockIcon from '~/ui/icons/OverdueClockIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

const Banner = styled.div`
  background-color: ${v.colors.alert};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1.33rem;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-left: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-right: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);

  @media only screen and (max-width: ${v.maxWidth +
      v.containerPadding.horizontal * v.fonts.baseSize}px) {
    margin-left: -${v.containerPadding.horizontal}rem;
    margin-right: -${v.containerPadding.horizontal}rem;
    padding: 20px ${v.containerPadding.horizontal}rem;
  }

  padding: 20px;

  a {
    color: white;
  }
`

const IconWrapper = styled.div`
  width: ${props => props.width || props.height || '32'}px;
  height: ${props => props.height || props.width || '32'}px;
`

const ClickableIconWrapper = styled(IconWrapper)`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

const Action = styled.div`
  font-size: 1rem;
  text-align: right;
`

@inject('apiStore', 'uiStore')
@observer
class OverdueBanner extends React.Component {
  hide = () => this.props.uiStore.hideOverdueBanner()

  render() {
    const currentOrganization = this.props.apiStore.currentUser
      .current_organization

    if (
      !this.props.uiStore.overdueBannerVisible ||
      currentOrganization.deactivated ||
      !currentOrganization.overdue ||
      !currentOrganization.in_app_billing
    ) {
      return null
    }

    const userCanEdit = currentOrganization.primary_group.can_edit

    return (
      <Banner>
        <MaxWidthContainer>
          <Grid container justify="space-between" alignItems="center">
            <Grid
              item
              xs={12}
              md={9}
              container
              spacing={16}
              alignItems="flex-end"
            >
              <Grid item xs={1}>
                <IconWrapper>
                  <OverdueClockIcon />
                </IconWrapper>
              </Grid>
              <Grid item xs={11}>
                {currentOrganization.name} account is overdue. Your content will
                become inaccessible on {currentOrganization.inaccessible_at}.
              </Grid>
            </Grid>
            <Grid item xs={12} md={3}>
              <Action>
                {userCanEdit ? (
                  <div>
                    Add payment method <Link to="/billing">here.</Link>
                  </div>
                ) : (
                  <Grid container spacing={16} alignItems="flex-end">
                    <Grid item>Contact your admin for assistance.</Grid>
                    <Grid item>
                      <ClickableIconWrapper onClick={this.hide}>
                        <CloseIcon />
                      </ClickableIconWrapper>
                    </Grid>
                  </Grid>
                )}
              </Action>
            </Grid>
          </Grid>
        </MaxWidthContainer>
      </Banner>
    )
  }
}

OverdueBanner.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OverdueBanner
