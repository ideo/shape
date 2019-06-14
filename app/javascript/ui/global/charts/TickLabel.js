import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

const StyledSvgText = styled.svg`
  visibility: hidden;
  :hover {
    visibility: visible;
  }
`

class TickLabel extends React.Component {
  render() {
    const { title, x, y } = this.props
    const originX = x - 50 // shift collision box to the left to wrap around the emoji
    const originY = y
    const labelBoxWidth = 100
    const labelBoxY = 30
    return (
      <StyledSvgText
        x={originX}
        y={originY}
        viewBox="0 0 120 140"
        width="120"
        height="140"
      >
        <g>
          <g>
            <rect
              x={0}
              y={0}
              width={labelBoxWidth}
              height={70}
              fill="#dddddd"
              fillOpacity={0}
            />
            <rect
              x={0}
              y={labelBoxY}
              rx={1.5}
              ry={1.5}
              width={labelBoxWidth}
              height={15}
              fill={v.colors.black}
              opacity={0.8}
            />
            <text
              x={labelBoxWidth / 2}
              textAnchor="middle"
              y={labelBoxY + 10}
              fontSize={8}
              fontFamily={v.fonts.sans}
              fill={v.colors.white}
            >
              {title}
            </text>
          </g>
        </g>
      </StyledSvgText>
    )
  }
}

TickLabel.propTypes = {
  title: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
}

export default TickLabel
