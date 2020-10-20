import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import HotCell from '~/ui/grid/HotCell'
import InlineLoader from '~/ui/layout/InlineLoader'
import PlusIcon from '~/ui/icons/PlusIcon'
import v from '~/utils/variables'

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

  &.visible,
  &:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
  }
  .plus-icon {
    display: none;
  }
`

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  render() {
    const {
      emptyRow,
      handleRemoveRowClick,
      handleInsertRowClick,
      onCloseHtc,
      interactionType,
      isFourWideBoard,
      onCreateContent,
      rowIdx,
      parent,
      visible,
      uiStore,
      zoomLevel,
    } = this.props

    let inner = ''

    if (interactionType === 'hover' || interactionType === 'hotcell') {
      inner = (
        <Fragment>
          {uiStore.isTouchDevice && (
            <div
              style={{
                backgroundColor: v.colors.primaryLight,
                position: 'relative',
                height: '100%',
              }}
              data-empty-space-click
            >
              <StyledPlusIcon className="plus-icon">
                <PlusIcon />
              </StyledPlusIcon>
            </div>
          )}
          <HotCell
            emptyRow={emptyRow}
            handleRemoveRowClick={handleRemoveRowClick}
            handleInsertRowClick={handleInsertRowClick}
            onCreateContent={onCreateContent}
            onCloseHtc={onCloseHtc}
            rowIdx={rowIdx}
            isFourWideBoard={isFourWideBoard}
            zoomLevel={zoomLevel}
          />
        </Fragment>
      )
    } else if (interactionType === 'bct') {
      const {
        blankContentToolState: { blankType },
      } = uiStore
      inner = <GridCardBlank parent={parent} preselected={blankType} />
    } else if (interactionType === 'unrendered') {
      inner = <InlineLoader background={v.colors.commonLightest} />
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
}

GridCardEmptyHotspot.propTypes = {
  parent: MobxPropTypes.objectOrObservableObject,
  onCreateContent: PropTypes.func.isRequired,
  card: MobxPropTypes.objectOrObservableObject,
  zoomLevel: PropTypes.number.isRequired,
  onCloseHtc: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  interactionType: PropTypes.string,
  emptyRow: PropTypes.bool,
  isFourWideBoard: PropTypes.bool,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  rowIdx: PropTypes.number,
}
GridCardEmptyHotspot.defaultProps = {
  visible: true,
  card: null,
  interactionType: 'drag',
  emptyRow: false,
  isFourWideBoard: false,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  rowIdx: 0,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
