import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import CursorIcon from '~/ui/icons/CursorIcon'
import { LabelText } from '~/ui/global/styled/typography'

const StyledCollaboratorCursor = styled.div`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  visibility: visible;
  opacity: 1;
  transition: visibility 0s 1s, opacity 0.5s linear;
  &.hidden {
    visibility: hidden;
    opacity: 0;
  }
  .icon {
    color: ${props => props.color};
    width: 18px;
    height: 18px;
  }
`

const CollaboratorLabelContainer = styled.div`
  position: relative;
  left: 9px;
  top: 0;
  /* NOTE: assumes white text will always look good over collaboratorColor */
  color: white;
  background: ${props => props.color};
  white-space: nowrap;
  padding: 0px 6px;
`
CollaboratorLabelContainer.displayName = 'CollaboratorLabelContainer'

class CollaboratorCursor extends React.Component {
  constructor(props) {
    super(props)
    this.debouncedFadeCursorOut = _.debounce(this.fadeCursorOut, 1 * 5000)
    this.state = {
      hidden: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.coordinates !== this.props.coordinates) {
      if (!this.state.hidden) {
        // this.debouncedFadeCursorOut()
      } else {
        this.setState({ hidden: false })
      }
    }
  }

  fadeCursorOut() {
    this.setState({
      hidden: true,
    })
  }

  render() {
    const { coordinates, color, name } = this.props

    if (!coordinates) return null

    const hexColor = v.colors[`collaboratorPrimary${color}`]
    const cursorClass = this.state.hidden ? 'hidden' : ''

    return (
      <StyledCollaboratorCursor
        color={hexColor}
        className={cursorClass}
        left={coordinates.x}
        top={coordinates.y}
      >
        <CursorIcon />
        <CollaboratorLabelContainer color={hexColor}>
          <LabelText>{name}</LabelText>
        </CollaboratorLabelContainer>
      </StyledCollaboratorCursor>
    )
  }
}

CollaboratorCursor.propTypes = {
  coordinates: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  color: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
}

export default CollaboratorCursor
