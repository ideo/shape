import _ from 'lodash'
import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CollaboratorCursor from '~/ui/global/collaborators/CollaboratorCursor'
import v from '~/utils/variables'

const CollaboratorCursorWrapper = styled.div`
  position: absolute;
  z-index: ${v.zIndex.aboveClickWrapper};
  top: ${props => props.top}px;
  left: ${props => props.left}px;
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
    const { relativeZoomLevel, foamcoreBoundingRectangle } = uiStore
    const cursors = _.map(this.collaborators, collaborator => {
      return (
        <CollaboratorCursor
          key={collaborator.id}
          collaborator={collaborator}
          relativeZoomLevel={relativeZoomLevel}
        />
      )
    })

    // match the 0,0 point of the CollaboratorCursorWrapper with the FoamcoreInteractionLayer
    const { left, top } = foamcoreBoundingRectangle
    return (
      <CollaboratorCursorWrapper left={left} top={top}>
        {cursors}
      </CollaboratorCursorWrapper>
    )
  }
}

CollaboratorCursorsLayer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollaboratorCursorsLayer
