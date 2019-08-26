import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

// const StyledVoteAreaDots = styled.div
//
// const VoteAreaDots = (numVotes, userHasVoted, toggleVote) => {
//   return <StyledVoteAreaDots>+ {numVotes}</StyledVoteAreaDots>
// }

const StyledGrowingDotWrapper = styled.div`
  position: absolute;
  z-index: 150;
  bottom: 0.5rem;
  left: 40%;

  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledVoteAreaGrowingDot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 100%;
  height: ${props => calculateSizeBy(props.numVotes)};
  width: ${props => calculateSizeBy(props.numVotes)};
  background: ${v.colors.primaryLight};

  div {
    max-width: 90%;
  }
`

const StyledVoteButton = styled.div`
  border-radius: 0.25rem;
  border: 1px ${v.colors.white};
  padding: 0.25rem;
  margin-left: 0.5rem;
  background: ${props =>
    props.userHasVoted ? v.colors.alert : v.colors.ctaPrimary};

  &:hover {
    opacity: 0.9;
    border: 1px solid ${v.colors.primaryLight};
  }
`

const VoteAreaGrowingDot = ({ numVotes, userHasVoted, toggleVote }) => {
  return (
    <StyledGrowingDotWrapper>
      {numVotes > 0 && (
        <StyledVoteAreaGrowingDot
          userHasVoted={userHasVoted}
          numVotes={numVotes}
        >
          <div>{numVotes}</div>
        </StyledVoteAreaGrowingDot>
      )}
      <StyledVoteButton
        userHasVoted={userHasVoted}
        onClick={toggleVote}
        role="button"
      >
        {userHasVoted ? 'Unvote' : 'Vote'}
      </StyledVoteButton>
    </StyledGrowingDotWrapper>
  )
}
VoteAreaGrowingDot.propTypes = {
  numVotes: PropTypes.number.isRequired,
  userHasVoted: PropTypes.bool.isRequired,
  toggleVote: PropTypes.func.isRequired,
}

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

const calculateSizeBy = votes => {
  const number = 20 + votes * 2.5
  return `${number}px`
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
      <VoteAreaGrowingDot
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
