import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledSvgText = styled.svg`
  font-size: 0.5em;
  visibility: hidden;
  :hover {
    visibility: visible;
  }
`

class TickLabel extends React.Component {
  render() {
    const { title, x, y, dx, dy } = this.props
    return (
      <StyledSvgText>
        <text x={x} y={y} dx={dx} dy={dy}>
          {title}
        </text>
      </StyledSvgText>
    )
  }
}

TickLabel.propTypes = {
  title: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  dx: PropTypes.number.isRequired,
  dy: PropTypes.number,
}

TickLabel.defaultProps = {
  dy: 0,
}

export default TickLabel
