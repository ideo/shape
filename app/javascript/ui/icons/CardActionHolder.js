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

  ${props =>
    !props.disableHover &&
    `
  &:hover {
    color: ${v.colors.black} !important;
  }
  `};
`
StyledIcon.displayName = 'StyledIcon'

const CardActionHolder = ({
  active,
  children,
  onClick,
  disableHover,
  size,
  tooltipText,
}) => (
  <Tooltip classes={{ tooltip: 'Tooltip' }} placement="top" title={tooltipText}>
    <StyledIcon
      className="icon"
      disableHover={disableHover}
      fill={active ? v.colors.black : v.colors.commonMedium}
      size={size}
      onClick={onClick}
    >
      {children}
    </StyledIcon>
  </Tooltip>
)

CardActionHolder.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
  disableHover: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.number,
  tooltipText: PropTypes.string,
}
CardActionHolder.defaultProps = {
  active: false,
  disableHover: false,
  onClick: () => {},
  size: 32,
  tooltipText: '',
}

export default CardActionHolder
