import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledVoteArea = styled.div`
  position: absolute;
  z-index: 150;
  bottom: 0.5rem;
  left: 40%;
  border: 2px solid ${v.colors.commonMedium};
  border-radius: 0.25rem;
  background: orange;
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
StyledVoteArea.displayName = 'StyledVotingArea'

@inject('uiStore')
@observer
class VoteArea extends React.Component {
  render() {
    const { voteCount } = this.props
    if (!voteCount || parseInt(voteCount) < 1) return null

    return (
      <StyledVoteArea>
        <div>+{voteCount} votes</div>
      </StyledVoteArea>
    )
  }
}

VoteArea.propTypes = {
  voteCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

VoteArea.defaultProps = {
  voteCount: 0,
}

// to override the long 'injected-xxx' name
VoteArea.displayName = 'VoteArea'

export default VoteArea
