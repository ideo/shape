import PropTypes from 'prop-types'
import styled from 'styled-components'

const PositionedDiv = styled.div`
  position: absolute;
  ${props => `
    width: ${props.width}px;
    height: ${props.height}px;
    transform: translate(${props.xPos}px, ${props.yPos}px);
    transform: translate3d(${props.xPos}px, ${props.yPos}px, 0);
    transition: ${props.transition};
    ${props.outline}
  `};
`

class PositionedGridCard extends React.PureComponent {
  render() {
    return <PositionedDiv {...this.props}>{this.props.children}</PositionedDiv>
  }
}

PositionedGridCard.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  xPos: PropTypes.number.isRequired,
  yPos: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
  transition: PropTypes.string,
  outline: PropTypes.string,
}

PositionedGridCard.defaultProps = {
  outline: '',
  transition: 'none',
}

export default PositionedGridCard
