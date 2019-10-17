import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

export const PillWrapper = styled.div`
  white-space: nowrap;
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  text-decoration: none;
  padding: 2px 7px;
  outline: none;
  margin: 5px;
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  justify-content: flex-start;
  height: 28px;
  display: inline-flex;
  color: black;
  cursor: default;
  border-radius: 0;
  border: none;
  background-color: ${v.colors.commonMediumTint};
  align-items: center;

  &.avatar {
    height: 28px;
    width: 28px;
  }
`
PillWrapper.displayName = 'PillWrapper'

const DeleteIconHolder = styled.span`
  width: 12px;
  height: 16px;
  margin-left: 8px;
  margin-bottom: 2px;
  color: ${v.colors.commonDark};
`

const SymbolHolder = styled.span`
  width: 16px;
  height: 16px;
  margin-right: 4px;
`

const Pill = props => {
  const { label, symbol, onDelete } = props.tag || props
  let { deleteIcon } = props.tag || props
  if (props.tag && !props.tag.deleteIcon) {
    deleteIcon = <CloseIcon />
  }
  return (
    <PillWrapper>
      <SymbolHolder>{symbol}</SymbolHolder>
      <DisplayText>{label}</DisplayText>
      {onDelete && (
        <DeleteIconHolder>
          <button onClick={onDelete}>{deleteIcon}</button>
        </DeleteIconHolder>
      )}
    </PillWrapper>
  )
}

Pill.propTypes = {
  label: PropTypes.string.isRequired,
  symbol: PropTypes.node,
  onDelete: PropTypes.func,
  deleteIcon: PropTypes.node,
  tag: PropTypes.node,
}

Pill.defaultProps = {
  symbol: null,
  onDelete: null,
  deleteIcon: <CloseIcon />,
  tag: null,
}

export default Pill
