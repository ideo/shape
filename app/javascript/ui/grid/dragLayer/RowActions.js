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
  position: absolute;
  left: -40px;
  top: ${props => props.position.y}px;

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

const RowActions = ({ row, onRemoveRow, onInsertRow }) => {
  const position = uiStore.positionForCoordinates({
    col: 1,
    row,
    width: 1,
    height: 1,
  })
  const cardHeight = uiStore.gridHeightFor(1)
  position.y = position.y + cardHeight / 2 - 35
  return (
    <RightBlankActions position={position}>
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title="Remove row"
        placement="top"
      >
        <CircleIconHolder onClick={ev => onRemoveRow(ev, row)}>
          <CircleTrashIcon />
        </CircleIconHolder>
      </Tooltip>
      <Tooltip classes={{ tooltip: 'Tooltip' }} title="Add row" placement="top">
        <CircleIconHolder onClick={ev => onInsertRow(ev, row)}>
          <CircleAddRowIcon />
        </CircleIconHolder>
      </Tooltip>
    </RightBlankActions>
  )
}
RowActions.propTypes = {
  row: PropTypes.number.isRequired,
  onRemoveRow: PropTypes.func.isRequired,
  onInsertRow: PropTypes.func.isRequired,
}

export default RowActions
