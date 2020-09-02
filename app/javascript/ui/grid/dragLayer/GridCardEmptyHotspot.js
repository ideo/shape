import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import HotCell from '~/ui/grid/HotCell'
import InlineLoader from '~/ui/layout/InlineLoader'
import v from '~/utils/variables'

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  render() {
    const {
      emptyRow,
      handleRemoveRowClick,
      handleInsertRowClick,
      interactionType,
      isFourWideBoard,
      onCreateContent,
      rowIdx,
      parent,
      visible,
    } = this.props

    let inner = ''

    if (interactionType === 'hover') {
      inner = (
        <HotCell
          parent={parent}
          emptyRow={emptyRow}
          handleRemoveRowClick={handleRemoveRowClick}
          handleInsertRowClick={handleInsertRowClick}
          onCreateContent={onCreateContent}
          rowIdx={rowIdx}
          isFourWideBoard={isFourWideBoard}
        />
      )
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
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  onCreateContent: PropTypes.func.isRequired,
  card: MobxPropTypes.objectOrObservableObject,
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
