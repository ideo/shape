import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import localStorage from 'mobx-localstorage'
import { runInAction } from 'mobx'
import styled from 'styled-components'

import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import HotCellQuadrant, { Quadrant } from './HotCellQuadrant'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const RightBlankActions = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 12px;
  top: calc(50% - 36px);
`
RightBlankActions.displayName = 'RightBlankActions'

export const CircleIconHolder = styled.button`
  border: 1px solid ${v.colors.secondaryMedium};
  border-radius: 50%;
  color: ${v.colors.secondaryMedium};
  height: 32px;
  width: 32px;
`

const Container = styled.div`
  height: 100%;
  width: 100%;

  ${Quadrant}:nth-child(even) {
    border-left: 1px solid ${v.colors.commonLight};
    width: calc(50% + 1px);
  }

  ${Quadrant}:nth-child(3),
  ${Quadrant}:nth-child(4) {
    border-top: 1px solid ${v.colors.commonLight};
    height: calc(50% + 1px);
  }
`

const HOT_CELL_DEFAULT_ITEM_TYPE = 'HotCellDefaultItemType'
const HOT_CELL_DEFAULT_COLLECTION_TYPE = 'HotCellDefaultCollectionType'

@inject('uiStore')
@observer
class HotCell extends React.Component {
  handleTypeClick = type => () => {
    this.startCreating(type)
  }

  onCreateContent = type => {
    const { onCreateContent } = this.props
    const collectionType = this.collectionTypes.find(
      collectionType => collectionType.name === type
    )
    const itemType = this.itemTypes.find(itemType => itemType.name === type)
    onCreateContent(type)
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

  renderRightBlankActions() {
    const { handleRemoveRowClick, handleInsertRowClick, rowIdx } = this.props
    return (
      <RightBlankActions>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Remove row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleRemoveRowClick(ev, rowIdx)}>
            <CircleTrashIcon />
          </CircleIconHolder>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Add row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleInsertRowClick(ev, rowIdx)}>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </Tooltip>
      </RightBlankActions>
    )
  }

  render() {
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
        {primaryTypes.map(({ name, description, subTypes }) => (
          <HotCellQuadrant
            name={name}
            description={description}
            subTypes={subTypes}
            onCreateContent={this.onCreateContent}
          />
        ))}
      </Container>
    )
  }
}

HotCell.propTypes = {
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  handleInsertRowClick: PropTypes.func.isRequired,
  handleRemoveRowClick: PropTypes.func.isRequired,
  onCreateContent: PropTypes.func.isRequired,
  emptyRow: PropTypes.bool,
  isFourWideBoard: PropTypes.bool,
  rowIdx: PropTypes.number,
}
HotCell.defaultProps = {
  emptyRow: false,
  isFourWideBoard: true,
  rowIdx: 0,
}
HotCell.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

HotCell.displayName = 'HotCell'

export default HotCell
