import PropTypes from 'prop-types'
import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import VoteIcon from '~/ui/icons/VoteIcon'

const StyledVoteAreaDots = styled.div`
  position: absolute;
  z-index: 150;
  bottom: 0.3rem;
  right: 30px;
  div {
    vertical-align: middle;
    display: inline-block;
  }
  .icon {
    width: 25px;
    margin-left: 5px;
    opacity: 0;
  }
  &:hover {
    .icon {
      opacity: 0.9;
    }
  }
  .and-more {
    font-family: ${v.fonts.sans};
    font-weight: 300;
    font-size: 1rem;
  }
`

const StyledDot = styled.div`
  margin-left: -4px;
  display: inline-block;
  width: 25px;
  height: 25px;
  border-radius: 100%;
  border: 0.5px solid #ccc;
  background-color: ${props =>
    props.highlightDot ? 'rgba(214, 103, 66, 0.9)' : 'rgba(53, 136, 158, 0.8)'};
`

const VoteAreaDots = ({ numVotes, userHasVoted, toggleVote }) => {
  const numDots = numVotes > 3 ? 3 : numVotes
  const andMore = numVotes > 3 ? numVotes - 3 : 0
  const dots = _.times(numDots, i => (
    <StyledDot highlightDot={userHasVoted && i === 0} />
  ))
  return (
    <StyledVoteAreaDots onClick={toggleVote}>
      {dots} <div className="and-more">{andMore > 0 && `+${andMore}`}</div>
      <div className="icon">
        <VoteIcon />
      </div>
    </StyledVoteAreaDots>
  )
}

VoteAreaDots.propTypes = {
  numVotes: PropTypes.number.isRequired,
  userHasVoted: PropTypes.bool.isRequired,
  toggleVote: PropTypes.func.isRequired,
}

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
      <VoteAreaDots
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
