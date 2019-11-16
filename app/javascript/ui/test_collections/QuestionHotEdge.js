import PropTypes from 'prop-types'
import styled from 'styled-components'

import PlusIcon from '~/ui/icons/PlusIcon'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

const HotEdge = styled.div`
  height: 0;
  margin-left: -15px;
  position: relative;
  top: ${props => {
    if (props.noCard) return 0

    return props.lastCard ? -30 : -20
  }}px;
  width: calc(100% + 42px);
  z-index: ${v.zIndex.floatOverContent};

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 376px;
  }
`

const HotEdgeVisuals = styled.div`
  opacity: ${props => (props.showing ? 1.0 : 0.0)};
  transition: opacity 0.2s;
  transition-timing-function: ease-in;
  visibility: ${props => (props.showing ? 'visible' : 'hidden')};
  z-index: ${v.zIndex.floatOverContent + 1};
`

const VisualBar = styled.div`
  background-color: ${props => props.theme.hotEdge};
  border-radius: 5px;
  height: 10px;
  position: absolute;
  top: 20px;
  width: calc(100% - 42px);
  left: 15px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    left: ${props => (props.noCard ? 25 : 15)}px;
  }
`
const RoundAddButton = styled.button`
  background-color: ${props => props.theme.hotEdge};
  border-radius: 50%;
  color: white;
  height: 32px;
  left: calc(50% - 16px);
  position: absolute;
  top: 10px;
  width: 32px;
  z-index: 900;

  svg {
    width: 16px;
  }
`

const HotAreaButton = styled.button`
  box-sizing: border-box;
  height: 25px;
  position: absolute;
  top: 10px;
  width: 100%;
  z-index: 901;
`

class QuestionHotEdge extends React.Component {
  state = { showing: false }

  componentDidMount() {
    if (uiStore.isTouchDevice) {
      this.setState({ showing: true })
    }
  }

  handleAdd = ev => {
    ev.preventDefault()
    this.props.onAdd()
  }

  handleMouseOver = ev => {
    this.setState({ showing: true })
  }

  handleMouseOut = ev => {
    this.setState({ showing: false })
  }

  render() {
    return (
      <HotEdge
        noCard={this.props.noCard}
        lastCard={this.props.lastCard}
        leftHandedCard={this.props.leftHandedCard}
      >
        <HotAreaButton
          data-cy="QuestionHotEdgeButton"
          onClick={this.handleAdd}
          onMouseEnter={this.handleMouseOver}
          onMouseLeave={this.handleMouseOut}
          onFocus={this.handleMouseOver}
          onBlur={this.handleMouseOut}
        />
        <HotEdgeVisuals showing={this.props.noCard || this.state.showing}>
          <VisualBar noCard={this.props.noCard} />
          <RoundAddButton onClick={this.handleAdd}>
            <PlusIcon />
          </RoundAddButton>
        </HotEdgeVisuals>
      </HotEdge>
    )
  }
}
QuestionHotEdge.propTypes = {
  onAdd: PropTypes.func.isRequired,
  lastCard: PropTypes.bool,
  leftHandedCard: PropTypes.bool,
  noCard: PropTypes.bool,
}
QuestionHotEdge.defaultProps = {
  lastCard: false,
  leftHandedCard: false,
  noCard: false,
}

export default QuestionHotEdge
