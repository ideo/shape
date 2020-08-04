import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import { Checkbox } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import { tagColor } from '~/ui/pages/shared/StyledReactTags'
import v from '~/utils/variables'

export const PillWrapper = styled.div`
  white-space: nowrap;
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  text-decoration: none;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-right: ${props => (props.paddingRight ? props.paddingRight : '7px')};
  padding-left: ${props => (props.paddingLeft ? props.paddingLeft : '7px')};
  outline: none;
  margin: 4px 8px 4px 0;
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
  background-color: ${props => tagColor(props.tagName)};
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
  width: ${props => props.symbolSize || 16}px;
  height: ${props => props.symbolSize || 16}px;
  margin-right: ${props => (props.selectable ? 6 : 12)}px;
`

const Pill = props => {
  const {
    label,
    selectable,
    selected,
    onSelect,
    symbol,
    symbolSize,
    onDelete,
    disabled,
  } = props.tag || props
  let { deleteIcon } = props.tag || props
  if (props.tag && !props.tag.deleteIcon) {
    deleteIcon = <CloseIcon />
  }
  const wrapperProps = {}
  if (props.tag) {
    wrapperProps.tagName = props.tag.name
  }
  if (!onDelete) wrapperProps.paddingRight = '14px'
  if (selectable) wrapperProps.paddingLeft = '4px'

  return (
    <PillWrapper {...wrapperProps} data-cy="Pill">
      {selectable && (
        <Checkbox
          style={{ marginRight: '0px', marginLeft: '-4px' }}
          color="primary"
          checked={selected}
          onChange={ev => {
            onSelect(props.tag || props)
          }}
          value="yes"
          disabled={disabled}
        />
      )}
      {symbol && (
        <SymbolHolder selectable={selectable} symbolSize={symbolSize}>
          {symbol}
        </SymbolHolder>
      )}
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
  label: PropTypes.string,
  symbol: PropTypes.node,
  symbolSize: PropTypes.number,
  onDelete: PropTypes.func,
  deleteIcon: PropTypes.node,
  tag: PropTypes.object,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
  id: PropTypes.string,
}

Pill.defaultProps = {
  label: '',
  symbol: null,
  symbolSize: 16,
  onDelete: null,
  deleteIcon: <CloseIcon />,
  tag: null,
  selectable: false,
  selected: false,
  disabled: false,
  onSelect: null,
  id: null,
}

export default Pill
