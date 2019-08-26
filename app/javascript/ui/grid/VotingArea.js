import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

// const StyledVoteAreaDots = styled.div
//
// const VoteAreaDots = (numVotes, userHasVoted, toggleVote) => {
//   return <StyledVoteAreaDots>+ {numVotes}</StyledVoteAreaDots>
// }

const StyledVoteAreaButton = styled.div`
  position: absolute;
  z-index: 150;
  bottom: 0.5rem;
  left: 40%;
  border: 2px solid ${v.colors.commonMedium};
  border-radius: 0.25rem;
  background: ${props =>
    props.userHasVoted ? v.colors.alert : v.colors.primaryLight};
  height: 1rem;
  padding: 0.25rem;
  width: 4rem;

  &:hover {
    border-color: ${v.colors.black};
  }

  &.selected {
    border-color: ${v.colors.commonMedium};
    background-color: ${v.colors.commonMedium};
  }
`
StyledVoteAreaButton.displayName = 'StyledVoteAreaButton'

const VoteAreaButton = ({ numVotes, userHasVoted, toggleVote }) => {
  return (
    <StyledVoteAreaButton userHasVoted={userHasVoted}>
      <div onClick={toggleVote} role="button">
        +{numVotes} votes
      </div>
    </StyledVoteAreaButton>
  )
}
VoteAreaButton.propTypes = {
  numVotes: PropTypes.number.isRequired,
  userHasVoted: PropTypes.bool.isRequired,
  toggleVote: PropTypes.func.isRequired,
}

@inject('uiStore')
@observer
class VoteArea extends React.Component {
  toggleVote = e => {
    e.stopPropagation()
    const { card } = this.props
    return card.API_toggleVote()
  }

  render() {
    const { card } = this.props
    const { user_has_voted, num_votes } = card

    return (
      <VoteAreaButton
        userHasVoted={user_has_voted}
        numVotes={num_votes}
        toggleVote={this.toggleVote}
      />
    )
  }
}

VoteArea.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

// to override the long 'injected-xxx' name
VoteArea.displayName = 'VoteArea'

export default VoteArea
