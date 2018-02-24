import PropTypes from 'prop-types'
import styled from 'styled-components'

const PositionedDiv = styled.div`
  position: absolute;
  ${props => (`
    width: ${props.width}px;
    height: ${props.height}px;
    transform: translate(${props.xPos}px, ${props.yPos}px) rotate(${props.rotation});
    transform: translate3d(${props.xPos}px, ${props.yPos}px, 0) rotate(${props.rotation});
    transition: ${props.transition};
    ${props.outline}
  `)}
`

class PositionedGridCard extends React.PureComponent {
  render() {
    return (
      <PositionedDiv {...this.props}>
        {this.props.children}
      </PositionedDiv>
    )
  }
}

PositionedGridCard.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  xPos: PropTypes.number.isRequired,
  yPos: PropTypes.number.isRequired,
  rotation: PropTypes.string.isRequired,
  transition: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  outline: PropTypes.string,
}

PositionedGridCard.defaultProps = {
  outline: ''
}

export default PositionedGridCard
