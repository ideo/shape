import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import localStorage from 'mobx-localstorage'
import { observable, runInAction } from 'mobx'
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

const HOT_CELL_DEFAULT_ITEM_TYPE = 'HotCellDefaultItemType'
const HOT_CELL_DEFAULT_COLLECTION_TYPE = 'HotCellDefaultCollectionType'

@inject('uiStore')
@observer
class HotCell extends React.Component {
  @observable
  isDraggedOver = false

  handleTypeClick = type => () => {
    this.startCreating(type)
  }

  onCreateContent = type => {
    const collectionType = this.collectionTypes.find(
      collectionType => collectionType.name === type
    )
    const itemType = this.itemTypes.find(itemType => itemType.name === type)
    runInAction(() => {
      if (collectionType) {
        localStorage.setItem(HOT_CELL_DEFAULT_COLLECTION_TYPE, type)
      } else if (itemType) {
        localStorage.setItem(HOT_CELL_DEFAULT_ITEM_TYPE, type)
      }
    })
  }

  get collectionTypes() {
    return [
      { name: 'collection', description: 'Create Collection' },
      { name: 'foamcoreBoard', description: 'Create Foamcore Board' },
      { name: 'searchCollection', description: 'Create Search Collection' },
      { name: 'submissionBox', description: 'Create Submission Box' },
      { name: 'testCollection', description: 'Get Feedback' },
    ]
  }

  get itemTypes() {
    return [
      { name: 'file', description: 'Add File' },
      { name: 'link', description: 'Add Link' },
      { name: 'video', description: 'Link Video' },
      { name: 'report', description: 'Create Report' },
    ]
  }

  get defaultCollectionType() {
    const collectionType = localStorage.getItem(
      HOT_CELL_DEFAULT_COLLECTION_TYPE
    )
    if (collectionType) {
      return this.collectionTypes.find(type => type.name === collectionType)
    }
    return this.collectionTypes[0]
  }

  get defaultItemType() {
    const itemType = localStorage.getItem(HOT_CELL_DEFAULT_ITEM_TYPE)
    if (itemType) {
      return this.itemTypes.find(type => type.name === itemType)
    }
    return this.itemTypes[0]
  }

  render() {
    const {
      parent,
      uiStore: { blankContentType },
    } = this.props

    const primaryTypes = [
      { name: 'text', description: 'Add Text' },
      { ...this.defaultItemType, subTypes: () => this.itemTypes },
      { ...this.defaultCollectionType, subTypes: () => this.collectionTypes },
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
              onCreateContent={this.onCreateContent}
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
