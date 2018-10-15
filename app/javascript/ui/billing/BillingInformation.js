import { observable, runInAction } from 'mobx'
import { Grid } from '@material-ui/core'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Section from '~shared/components/molecules/Section'
import Typography from '~shared/components/atoms/Typography'
import Box from '~shared/components/atoms/Box'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Loader from '~/ui/layout/Loader'
import trackError from '~/utils/trackError'
import { formatAsDollarAmount, formatDate } from '~shared/utils/formatters'

const Block = ({ title, children }) => (
  <Grid item xs={4}>
    <Typography variant="label">{title}</Typography>
    <Box mt={20}>{children}</Box>
  </Grid>
)

const Prominent = styled.div`
  font-family: 'Gotham';
  font-size: 48px;
  line-height: 22px;
`

Block.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

@inject('apiStore', 'networkStore')
@observer
class BillingInformation extends React.Component {
  @observable
  loaded = false

  componentWillMount() {
    this.load()
  }

  async load() {
    const {
      apiStore: { currentUserOrganizationId: organizationId },
      networkStore,
    } = this.props
    try {
      await networkStore.loadOrganization(organizationId)
      await networkStore.loadPlans(organizationId)
      runInAction(() => (this.loaded = true))
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    if (!this.loaded) {
      return <Loader />
    }
    const {
      currentUserOrganization: {
        active_users_count,
        trial_users_count,
        trial_ends_at,
        is_within_trial_period,
        price_per_user,
        current_billing_period_start,
        current_billing_period_end,
      },
    } = this.props.apiStore

    const trailsUsedCount =
      active_users_count > trial_users_count
        ? trial_users_count
        : active_users_count

    const billableUserCount = is_within_trial_period
      ? active_users_count - trial_users_count
      : active_users_count

    const currentMonthlyRate =
      billableUserCount > 0 ? billableUserCount * price_per_user : 0

    return (
      <Section title="Billing Information">
        <Grid container spacing={40}>
          <Block title="Current Active People">
            <Grid container>
              <Grid item>
                <Prominent>{active_users_count}</Prominent>
              </Grid>
              <Grid item>{is_within_trial_period && 'Total People'}</Grid>
            </Grid>
            <Grid container>
              <Grid item>{trailsUsedCount}</Grid>
              <Grid item> on free trial</Grid>
            </Grid>
            {is_within_trial_period &&
              billableUserCount > 0 && (
                <div>
                  <HorizontalDivider />
                  <Grid container>
                    <Grid item>{billableUserCount}</Grid>
                    <Grid item>billable people</Grid>
                  </Grid>
                </div>
              )}
          </Block>
          <Block title="Current Monthly Rate">
            <Prominent>{formatAsDollarAmount(currentMonthlyRate)}</Prominent>
            {formatAsDollarAmount(price_per_user)}
            /person per month
            <div>
              Total monthly rate does not include people covered by free trial
              conditions.
            </div>
          </Block>
          <Block title="Current Billing Period">
            <Grid container>
              <Grid item>Start date:</Grid>
              <Grid item>
                {formatDate(current_billing_period_start, 'MM/DD/YYYY')}
              </Grid>
            </Grid>
            <Grid container>
              <Grid item>End date:</Grid>
              <Grid item>
                {formatDate(current_billing_period_end, 'MM/DD/YYYY')}
              </Grid>
            </Grid>
            {is_within_trial_period && (
              <div>
                <div>FREE TRIAL</div>
                <Grid container>
                  <Grid item>Free trials used:</Grid>
                  <Grid item>
                    {trailsUsedCount} of {trial_users_count}
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item>Trial expires:</Grid>
                  <Grid item>{trial_ends_at}</Grid>
                </Grid>
              </div>
            )}
          </Block>
        </Grid>
      </Section>
    )
  }
}

BillingInformation.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BillingInformation
