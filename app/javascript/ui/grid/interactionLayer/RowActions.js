import PropTypes from 'prop-types'
import styled from 'styled-components'

import CircleAddRowIcon from '~/ui/icons/CircleAddRowIcon'
import CircleTrashIcon from '~/ui/icons/CircleTrashIcon'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

const RightBlankActions = styled.div`
  color: ${v.colors.secondaryMedium};
  display: flex;
  flex-direction: column;
  height: ${props => props.height}px;
  padding-top: ${props => props.height / 2}px;
  position: absolute;
  left: -46px;
  top: ${props => props.position.y - 8}px;

  &:hover {
    color: ${v.colors.black};
  }
`
RightBlankActions.displayName = 'RightBlankActions'

export const CircleIconHolder = styled.button`
  border: 1px solid ${v.colors.secondaryMedium};
  border-radius: 50%;
  color: ${v.colors.secondaryMedium};
  height: 32px;
  width: 32px;
`

const IconPadding = styled.div`
  padding-bottom: 6px;
  padding-right: 10px;
  padding-left: 6px;
`

const RowActions = ({ row, height, onRemoveRow, onInsertRow }) => {
  const position = uiStore.positionForCoordinates({
    col: 1,
    row,
    width: 1,
    height: 1,
  })
  const relativeHeight = uiStore.gridHeightFor(height) / uiStore.zoomLevel
  position.y = position.y - 35
  return (
    <RightBlankActions
      position={position}
      height={relativeHeight}
      id="RowActions"
    >
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title="Remove row"
        placement="top"
      >
        <IconPadding onClick={ev => onRemoveRow(ev, row)}>
          <CircleIconHolder>
            <CircleTrashIcon />
          </CircleIconHolder>
        </IconPadding>
      </Tooltip>
      <Tooltip classes={{ tooltip: 'Tooltip' }} title="Add row" placement="top">
        <IconPadding onClick={ev => onInsertRow(ev, row)}>
          <CircleIconHolder>
            <CircleAddRowIcon />
          </CircleIconHolder>
        </IconPadding>
      </Tooltip>
    </RightBlankActions>
  )
}
RowActions.propTypes = {
  row: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onRemoveRow: PropTypes.func.isRequired,
  onInsertRow: PropTypes.func.isRequired,
}

export default RowActions
