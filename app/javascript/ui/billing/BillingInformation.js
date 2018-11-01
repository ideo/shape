import { Fragment } from 'react'
import { observable, runInAction } from 'mobx'
import { Grid } from '@material-ui/core'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Section from '~shared/components/molecules/Section'
import Typography from '~shared/components/atoms/Typography'
import FancyDollarAmount from '~shared/components/atoms/FancyDollarAmount'
import Box from '~shared/components/atoms/Box'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Loader from '~/ui/layout/Loader'
import trackError from '~/utils/trackError'
import { formatAsDollarAmount, formatDate } from '~shared/utils/formatters'
import v from '~/utils/variables'

const Wrapper = styled.div`
  font-family: 'Gotham';
`

const Instructional = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: ${v.colors.commonMedium};
  letter-spacing: 0;
`

const BillingNoticeWrapper = styled.div`
  text-align: center;
`

const BillingNotice = styled.div`
  font-size: 16px;
  line-height: 22px;
  color: #a89f9b;
  max-width: 500px;
  margin: 0 auto 20px;
`

const BlockHeader = styled.h3`
  font-size: 16px;
  letter-spacing: 0.5px;
  font-weight: 500;
`

const Block = ({ title, children }) => (
  <Grid item xs={3}>
    <BlockHeader>{title}</BlockHeader>
    <Box mt={20}>{children}</Box>
  </Grid>
)
Block.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const TrialHighlight = styled.div`
  background-color: #c0dbde;
`

const FreeTrial = styled(TrialHighlight)`
  font-size: 16px;
  line-height: 11px;
  letter-spacing: 0.5px;
  padding: 8px;
  margin: 15px 0;
  font-weight: 500;
  display: inline-block;
`

const Label = styled.span`
  font-size: 16px;
  color: ${v.colors.commonDark};
`

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
        in_app_billing,
        active_users_count,
        current_billing_period_end,
        current_billing_period_start,
        is_within_trial_period,
        name,
        price_per_user,
        trial_ends_at,
        trial_users_count,
      },
    } = this.props.apiStore

    const trialsUsedCount =
      active_users_count > trial_users_count
        ? trial_users_count
        : active_users_count

    const billableUserCount = is_within_trial_period
      ? active_users_count - trial_users_count
      : active_users_count

    const currentMonthlyRate =
      billableUserCount > 0 ? billableUserCount * price_per_user : 0

    return (
      <Wrapper>
        <Section title="Billing Information">
          <Grid container justify="space-between">
            <Block title="Current Active People">
              <Grid container justify="space-between" alignItems="flex-end">
                <Grid item>
                  <Typography variant="emphasis">
                    {active_users_count}
                  </Typography>
                </Grid>
                <Grid item>{is_within_trial_period && 'Total People'}</Grid>
              </Grid>
              {is_within_trial_period && (
                <div>
                  <TrialHighlight>
                    <Box my={20} p={10}>
                      <Grid container justify="space-between">
                        <Grid item>{trialsUsedCount}</Grid>
                        <Grid item>People on free trial</Grid>
                      </Grid>
                    </Box>
                  </TrialHighlight>
                  <HorizontalDivider />
                  <Box p={10}>
                    <Grid container justify="space-between">
                      <Grid item>
                        {billableUserCount < 1 ? 0 : billableUserCount}
                      </Grid>
                      <Grid item>Billable people</Grid>
                    </Grid>
                  </Box>
                </div>
              )}
            </Block>
            {in_app_billing ? (
              <Fragment>
                <Block title="Current Monthly Rate">
                  <FancyDollarAmount>{currentMonthlyRate}</FancyDollarAmount>
                  <Box my={25}>
                    {formatAsDollarAmount(price_per_user)}
                    /person per month
                  </Box>
                  <Instructional>
                    Total monthly rate does not include people covered by free
                    trial conditions.
                  </Instructional>
                </Block>
                <Block title="Current Billing Period">
                  <Grid container justify="space-between" spacing={16}>
                    <Grid item>
                      <Label>Start date:</Label>
                    </Grid>
                    <Grid item>
                      {formatDate(current_billing_period_start, 'MM/DD/YYYY')}
                    </Grid>
                  </Grid>
                  <Grid container justify="space-between" spacing={16}>
                    <Grid item>
                      <Label>End date:</Label>
                    </Grid>
                    <Grid item>
                      {formatDate(current_billing_period_end, 'MM/DD/YYYY')}
                    </Grid>
                  </Grid>
                  {is_within_trial_period && (
                    <div>
                      <FreeTrial>FREE TRIAL</FreeTrial>
                      <Grid container justify="space-between" spacing={16}>
                        <Grid item>
                          <Label>Free trials used:</Label>
                        </Grid>
                        <Grid item>
                          {trialsUsedCount} of {trial_users_count}
                        </Grid>
                      </Grid>
                      <Grid container justify="space-between" spacing={16}>
                        <Grid item>
                          <Label>Trial expires:</Label>
                        </Grid>
                        <Grid item>{trial_ends_at}</Grid>
                      </Grid>
                    </div>
                  )}
                </Block>
              </Fragment>
            ) : (
              <Grid item xs={9}>
                <BillingNoticeWrapper>
                  <Box my={20}>
                    <h3>Current Rate & Billing Period</h3>
                  </Box>
                  <BillingNotice>
                    Billing for {name} instance is not handled by this
                    application. Email{' '}
                    <a href="mailto:hello@shape.space">hello@shape.space</a> for
                    more information.
                  </BillingNotice>
                </BillingNoticeWrapper>
              </Grid>
            )}
          </Grid>
        </Section>
      </Wrapper>
    )
  }
}

BillingInformation.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  networkStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BillingInformation
