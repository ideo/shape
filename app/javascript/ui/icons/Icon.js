import PropTypes from 'prop-types'
import styled from 'styled-components'

export const StyledIcon = styled.span`
  position: relative;
  display: inline-block;
  svg {
    width: 100%;
    height: 100%;
    ${props => (props.hasStroke ? 'stroke: currentColor;' : '')}
    ${props => (props.hasFill ? 'fill: currentColor;' : '')}
  }
`
StyledIcon.displayName = 'StyledIcon'

const Icon = (props) => (
  <StyledIcon
    className="icon"
    hasStroke={props.stroke}
    hasFill={props.fill}
  >
    {props.children}
  </StyledIcon>
)

Icon.propTypes = {
  stroke: PropTypes.bool,
  fill: PropTypes.bool,
  children: PropTypes.node.isRequired,
}
Icon.defaultProps = {
  stroke: false,
  fill: false,
}

export default Icon
