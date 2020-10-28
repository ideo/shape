import _ from 'lodash'
import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CollaboratorCursor from '~/ui/global/collaborators/CollaboratorCursor'
import v from '~/utils/variables'

const CollaboratorCursorWrapper = styled.div`
  position: absolute;
  z-index: ${v.zIndex.aboveClickWrapper};
  /* these numbers just account for the top/left of FoamcoreInteractionLayer */
  left: 28px;
  top: 134px;
`

@inject('uiStore')
@observer
class CollaboratorCursorsLayer extends React.Component {
  @computed
  get collaborators() {
    const { uiStore } = this.props
    const { viewingCollection } = uiStore
    if (!viewingCollection) return []

    return viewingCollection.collaborators
  }

  render() {
    const { uiStore } = this.props
    const { relativeZoomLevel } = uiStore
    const cursors = _.map(this.collaborators, collaborator => {
      const { coordinates, name, color } = collaborator
      if (_.isEmpty(coordinates)) {
        return null
      }
      return (
        <CollaboratorCursor
          key={collaborator.id}
          coordinates={{
            // adjust for zoomLevel
            x: coordinates.x / relativeZoomLevel,
            y: coordinates.y / relativeZoomLevel,
          }}
          color={color}
          name={name}
        />
      )
    })

    return <CollaboratorCursorWrapper>{cursors}</CollaboratorCursorWrapper>
  }
}

CollaboratorCursorsLayer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollaboratorCursorsLayer
