// import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledCollaboratorCursor = styled.div`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  width: 35px;
  height: 35px;
  background: ${props => props.color};
`

class CollaboratorCursor extends React.Component {
  render() {
    const { collaborator, relativeZoomLevel } = this.props
    const { coordinates, color } = collaborator

    if (!coordinates) return null

    return (
      <StyledCollaboratorCursor
        left={coordinates.x / relativeZoomLevel}
        top={coordinates.y / relativeZoomLevel}
        color={v.colors[`collaboratorSecondary${color}`]}
      />
    )
  }
}

CollaboratorCursor.propTypes = {
  collaborator: MobxPropTypes.objectOrObservableObject.isRequired,
  relativeZoomLevel: PropTypes.number.isRequired,
}

export default CollaboratorCursor
