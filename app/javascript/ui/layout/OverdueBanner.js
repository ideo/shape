import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import ClockIcon from '~/ui/icons/ClockIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

const Banner = styled.div`
  background-color: ${v.colors.orange};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 20px;
  margin: 20px -999rem;
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
  font-size: 16px;
  text-align: right;
`

@inject('apiStore')
@observer
class OverdueBanner extends React.Component {
  state = {
    hidden: false,
  }

  hide = () => this.setState({ hidden: true })

  render() {
    const currentOrganization = this.props.apiStore.currentUser
      .current_organization

    if (
      this.state.hidden ||
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
            <Grid item xs={9} container spacing={16} alignItems="flex-end">
              <Grid item>
                <IconWrapper>
                  <ClockIcon />
                </IconWrapper>
              </Grid>
              <Grid item>
                {currentOrganization.name} account is overdue. Your content will
                become inaccessible on {currentOrganization.inaccessible_at}.
              </Grid>
            </Grid>
            <Grid item xs={3}>
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
}

export default OverdueBanner
