import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'

class RespondentBanner extends React.Component {
  render() {
    const { user } = this.props

    if (!user || user.current_incentive_balance < 1) return ''

    return (
      <StyledBanner>
        <div>
          <DisplayText color={'white'}>
            You have earned ${user.current_incentive_balance}.
          </DisplayText>
        </div>
        <div>
          <DisplayText color={'white'}>
            You will receive your payment before {user.incentive_due_date}.
          </DisplayText>
        </div>
      </StyledBanner>
    )
  }
}

const StyledBanner = styled.div`
  background: ${v.colors.secondaryDark};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 1rem;
`

RespondentBanner.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
}

RespondentBanner.defaultProps = {
  user: null,
}
RespondentBanner.displayName = 'RespondentBanner'

export default RespondentBanner
