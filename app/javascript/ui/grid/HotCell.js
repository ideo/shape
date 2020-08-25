import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable } from 'mobx'
import styled from 'styled-components'

import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import HotCellQuadrant, { Quadrant } from './HotCellQuadrant'

const Container = styled.div`
  height: 100%;
  width: 100%;

  ${Quadrant}:nth-child(even) {
    margin-left: 1px;
  }

  ${Quadrant}:nth-child(3),
  ${Quadrant}:nth-child(4) {
    margin-top: 1px;
  }
`

@inject('uiStore')
@observer
class HotCell extends React.Component {
  @observable
  isDraggedOver = false

  handleTypeClick = type => () => {
    this.startCreating(type)
  }

  render() {
    const {
      parent,
      uiStore: { blankContentType },
    } = this.props
    const itemTypes = [
      { name: 'file', description: 'Add File' },
      { name: 'link', description: 'Add Link' },
      { name: 'video', description: 'Link Video' },
      { name: 'report', description: 'Create Report' },
    ]

    const collectionTypes = [
      { name: 'collection', description: 'Create Collection' },
      { name: 'foamcore', description: 'Create Foamcore Board' },
      { name: 'searchCollection', description: 'Create Search Collection' },
      { name: 'submissionBox', description: 'Create Submission Box' },
      { name: 'testCollection', description: 'Get Feedback' },
    ]

    const primaryTypes = [
      { name: 'text', description: 'Add Text' },
      { name: 'file', description: 'Add File', subTypes: () => itemTypes },
      {
        name: 'collection',
        description: 'Create Collection',
        subTypes: () => collectionTypes,
      },
      {
        name: 'template',
        description: 'Create New Template',
        subTypes: this.fetchTemplates,
      },
    ]

    return (
      <Container>
        {blankContentType ? (
          <GridCardBlank preselected={blankContentType} parent={parent} />
        ) : (
          primaryTypes.map(({ name, description, subTypes }) => (
            <HotCellQuadrant
              name={name}
              description={description}
              subTypes={subTypes}
            />
          ))
        )}
      </Container>
    )
  }
}

HotCell.propTypes = {
  visible: PropTypes.bool,
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
}
HotCell.defaultProps = {
  visible: false,
}
HotCell.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

HotCell.displayName = 'HotCell'

export default HotCell
