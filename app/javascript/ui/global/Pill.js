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
/*
 * A modular box that can list pieces of data like tags.
 *
 * @component
 */
const Pill = props => {
  const {
    label,
    selectable,
    selected,
    onSelect,
    symbol,
    symbolSize,
    onDelete,
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
    <PillWrapper {...wrapperProps}>
      {selectable && (
        <Checkbox
          style={{ marginRight: '0px', marginLeft: '-4px' }}
          color="primary"
          checked={selected}
          onChange={ev => {
            onSelect(props.tag || props)
          }}
          value="yes"
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
  /** The text to put into the pill */
  label: PropTypes.string,
  /**
   * A graphic symbol in put to the left side of the text on the pill which can
   * be an svg or something else
   */
  symbol: PropTypes.node,
  /** The size of the symbol in px */
  symbolSize: PropTypes.number,
  /**
   * A function to call when the close / delete icon is clicked. Passing this
   * prop will also render a default close icon on the pill
   */
  onDelete: PropTypes.func,
  /**
   * An override for the default close icon for deleting the Pill
   */
  deleteIcon: PropTypes.node,
  /**
   * A tag with all the same props as this component. This is used when we have
   * a 3rd party library using the Pill that has it's own structure for the
   * component that gets passed to pill.
   */
  tag: PropTypes.object,
  /**
   * If the pill is possible to select, passing true will render a checkbox to
   * the left size of the pill text.
   */
  selectable: PropTypes.bool,
  /**
   * Keeps the state if the pill is selected, should only be used if `selectable`
   * is being used
   */
  selected: PropTypes.bool,
  /**
   * The function to call when the select checkbox is clicked, should only be
   * used if `selectable` is being used
   */
  onSelect: PropTypes.func,
  /** A unique ID for the Pill, used to uniquely identify it */
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
  onSelect: null,
  id: null,
}

export default Pill
