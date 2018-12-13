import PropTypes from 'prop-types'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

export const StyledIcon = styled.span`
  color: ${props => props.fill};
  display: inline-block;
  height: ${props => props.size}px;
  vertical-align: top;
  width: ${props => props.size}px;

  &:hover {
    color: ${v.colors.black} !important;
  }
`
StyledIcon.displayName = 'StyledIcon'

const CardActionHolder = ({ children, color, onClick, size, tooltipText }) => (
  <Tooltip classes={{ tooltip: 'Tooltip' }} placement="top" title={tooltipText}>
    <StyledIcon className="icon" fill={color} size={size} onClick={onClick}>
      {children}
    </StyledIcon>
  </Tooltip>
)

CardActionHolder.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(Object.values(v.colors)),
  onClick: PropTypes.func,
  size: PropTypes.number,
  tooltipText: PropTypes.string,
}
CardActionHolder.defaultProps = {
  color: v.colors.commonMedium,
  onClick: () => {},
  size: 32,
  tooltipText: '',
}

export default CardActionHolder
