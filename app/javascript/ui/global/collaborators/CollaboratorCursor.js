// import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import CursorIcon from '~/ui/icons/CursorIcon'
import { LabelText } from '~/ui/global/styled/typography'

const StyledCollaboratorCursor = styled.div`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  display: ${props => props.display};
  width: 13px;
  height: 18px;
`

const CollaboratorLabelContainer = styled.div`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  display: ${props => props.display};
  background: ${props => props.color};
  white-space: nowrap;
  padding: 0px 6px;
`

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
        this.debouncedFadeCursorOut()
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
    const { coordinates, color, name, relativeZoomLevel } = this.props

    if (!coordinates) return null

    const hexColor = v.colors[`collaboratorSecondary${color}`]
    const left = coordinates.x / relativeZoomLevel
    const top = coordinates.y / relativeZoomLevel
    const display = this.state.hidden ? 'none' : 'block'

    return (
      <React.Fragment>
        <StyledCollaboratorCursor left={left} top={top} display={display}>
          <CursorIcon color={hexColor} />
        </StyledCollaboratorCursor>
        <CollaboratorLabelContainer
          color={hexColor}
          left={left + 7}
          top={top + 16}
          display={display}
        >
          <LabelText>{name}</LabelText>
        </CollaboratorLabelContainer>
      </React.Fragment>
    )
  }
}

CollaboratorCursor.propTypes = {
  coordinates: PropTypes.shape({
    left: PropTypes.number,
    top: PropTypes.number,
  }).isRequired,
  color: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  relativeZoomLevel: PropTypes.number.isRequired,
}

export default CollaboratorCursor
