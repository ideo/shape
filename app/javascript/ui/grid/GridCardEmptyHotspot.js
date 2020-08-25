import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import { isFile } from '~/utils/FilestackUpload'
import HotCell from '~/ui/grid/HotCell'
import InlineLoader from '~/ui/layout/InlineLoader'
import Tooltip from '~/ui/global/Tooltip'
import PlusIcon from '~/ui/icons/PlusIcon'
import CloudIcon from '~/ui/icons/CloudIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'
import v from '~/utils/variables'
import { Heading2 } from '~/ui/global/styled/typography'

const StyledDropzoneHolder = styled.div`
  position: absolute;
  height: 20%;
  top: 38%;
  left: 28%;
  color: ${v.colors.secondaryMedium};
  pointer-events: none;
`

const StyledPlusIcon = styled.div`
  position: absolute;
  /* TODO: better styling than this? */
  width: 20%;
  height: 20%;
  top: 38%;
  left: 38%;
  color: ${v.colors.secondaryMedium};
`

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  ${props =>
    !props.currentlyHotCell &&
    `
  &.visible,
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
    .cloud-icon {
      display: block;
    }
  }
  .plus-icon,
  .cloud-icon {
    display: none;
  }
  `}
`

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

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  @observable
  isDraggedOver = false
  @observable
  isMouseOver = false

  openBlankContentTool = () => {
    const { uiStore, card } = this.props
    if (!card) return
    const { order, position } = card
    uiStore.openBlankContentTool({
      order,
      col: position.x,
      row: position.y,
    })
  }

  onClickHotspot = () => {
    const { card } = this.props
    if (!card) return
    const collection = card.parentCollection

    // confirmEdit will check if we're in a template and need to confirm changes
    if (collection) {
      collection.confirmEdit({
        onConfirm: () => this.openBlankContentTool(),
      })
      return
    }
    this.openBlankContentTool()
  }

  handleMouseOver = ev => {
    runInAction(() => {
      this.isMouseOver = true
    })
  }

  handleMouseLeave = ev => {
    runInAction(() => {
      this.isMouseOver = false
    })
  }

  onDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    runInAction(() => {
      this.isDraggedOver = isFile(e.dataTransfer)
    })
  }

  onDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    runInAction(() => {
      this.isDraggedOver = false
    })
  }

  get renderRightBlankActions() {
    const { handleRemoveRowClick, handleInsertRowClick, row } = this.props
    return (
      <RightBlankActions>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Remove row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleRemoveRowClick(ev, row)}>
            <CircleTrashIcon />
          </CircleIconHolder>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Add row"
          placement="top"
        >
          <CircleIconHolder onClick={ev => handleInsertRowClick(ev, row)}>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </Tooltip>
      </RightBlankActions>
    )
  }

  get renderGridCardEmpty() {
    const { card, visible, interactionType, numColumns, emptyRow } = this.props

    let inner = ''

    if (interactionType === 'hover') {
      inner = (
        <div
          style={{ position: 'relative', height: '100%' }}
          data-empty-space-click
        >
          <StyledPlusIcon className="plus-icon">
            <PlusIcon />
          </StyledPlusIcon>
          {numColumns === 4 && emptyRow && this.renderRightBlankActions}
        </div>
      )
    } else if (interactionType === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
    }
    if (this.isMouseOver) {
      inner = <HotCell card={card} />
    }

    return (
      <StyledGridCardEmpty
        className={visible ? 'visible' : ''}
        onMouseEnter={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        currentlyHotCell={this.isMouseOver}
      >
        {inner}
      </StyledGridCardEmpty>
    )
  }

  get renderGridCardDropzone() {
    const { visible } = this.props
    return (
      <StyledGridCardEmpty
        className={visible ? 'visible' : ''}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
      >
        {this.isDraggedOver && (
          <StyledDropzoneHolder className="cloud-icon">
            <CloudIcon />
            <Heading2 fontSize={'1em'}>Drag & Drop</Heading2>
          </StyledDropzoneHolder>
        )}
      </StyledGridCardEmpty>
    )
  }

  render() {
    const { uploading } = this.props
    return uploading ? this.renderGridCardDropzone : this.renderGridCardEmpty
  }
}

GridCardEmptyHotspot.propTypes = {
  visible: PropTypes.bool,
  card: MobxPropTypes.objectOrObservableObject,
  uploading: PropTypes.bool,
  interactionType: PropTypes.string,
  numColumns: PropTypes.number,
  emptyRow: PropTypes.bool,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  row: PropTypes.number,
}
GridCardEmptyHotspot.defaultProps = {
  card: null,
  visible: false,
  uploading: false,
  interactionType: 'drag',
  numColumns: 4,
  emptyRow: false,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  row: 0,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
