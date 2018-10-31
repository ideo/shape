import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import ClockIcon from '~/ui/icons/ClockIcon'
import v from '~/utils/variables'

const Banner = styled.div`
  background-color: ${v.colors.orange};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 20px;
  margin: 0 -${v.containerPadding.horizontal};
  padding: 20px;

  a {
    color: white;
  }
`

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
`

const Action = styled.div`
  font-size: 16px;
  text-align: right;
`

@inject('apiStore')
@observer
class OverdueBanner extends React.Component {
  render() {
    const currentOrganization = this.props.apiStore.currentUser
      .current_organization

    if (!currentOrganization.overdue || !currentOrganization.in_app_billing) {
      return null
    }

    const userCanEdit = currentOrganization.primary_group.can_edit

    return (
      <Banner>
        <MaxWidthContainer>
          <Grid container justify="space-between" alignItems="center">
            <Grid item xs={1}>
              <IconWrapper>
                <ClockIcon />
              </IconWrapper>
            </Grid>
            <Grid item xs={8}>
              {currentOrganization.name} account is overdue. Your content will
              become inaccessible on {currentOrganization.inaccessible_at}.
            </Grid>
            <Grid item xs={3}>
              <Action>
                {userCanEdit ? (
                  <div>
                    Add payment method <Link to="/billing">here.</Link>
                  </div>
                ) : (
                  <div>Contact your admin for assistance.</div>
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
