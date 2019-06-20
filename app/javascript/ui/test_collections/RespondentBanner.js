import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import { Grid } from '@material-ui/core'

const StyledRespondentBanner = styled.div`
  z-index: 3;
  background-color: ${v.colors.respondentBannerBackground};
  color: ${v.colors.respondentBannerText};
  font-family: ${v.fonts.sans};
  padding: 15px 25px;
  position: fixed;

  border-radius: 7px;
  font-size: 20px;
  margin-top: -16px; // due to required padding in TestSurveyPage StyledBg
  margin-left: auto;
  margin-right: auto;
  max-width: 950px; // cut from 1000 due to padding
  left: 10%;
  right: 10%;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    border-radius: 0;
    margin-top: -36px;
    font-size: 16px;
    line-height: 20px;
    padding: 15px 40px;
    left: 0%;
    right: 0%;
  }
`
StyledRespondentBanner.displayName = 'StyledRespondentBanner'

const StyledGrid = styled(Grid)`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    text-align: center;
  }
`

@observer
class RespondentBanner extends React.Component {
  get user() {
    const { user } = this.props
    return user
  }

  get hideBanner() {
    return !this.user || this.user.current_incentive_balance < 1
  }

  get earnings() {
    return parseFloat(this.user.current_incentive_balance).toFixed(2)
  }

  render() {
    if (this.hideBanner) return ''

    return (
      <StyledRespondentBanner>
        <Grid container justify="space-between" alignItems="center">
          <StyledGrid item xs={12} md={6}>
            <span>You have earned ${this.earnings}.</span>
          </StyledGrid>
          <StyledGrid item xs={12} md={6}>
            <span>
              You will receive your payment by {this.user.incentive_due_date}.
            </span>
          </StyledGrid>
        </Grid>
      </StyledRespondentBanner>
    )
  }
}

RespondentBanner.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
}

RespondentBanner.defaultProps = {
  user: null,
}
RespondentBanner.displayName = 'RespondentBanner'

export default RespondentBanner
