import PropTypes from 'prop-types'
import Icon from './Icon'

function directionToAngle(direction) {
  switch (direction) {
  case 'right':
    return 0
  case 'down':
    return 90
  case 'left':
    return 180
  case 'up':
    return -90
  default:
    return 0
  }
}

const ArrowIcon = (props) => (
  <Icon fill>
    <svg viewBox="0 0 16 16">
      <title>Move</title>
      <g>
        <g transform={`translate(8.444444, 5.000000) rotate(${directionToAngle(props.direction)}) translate(-8.444444, -5.000000) translate(4.000000, -3.000000)`}>
          <path d="M8.41333333,7.58133333 L1.38666667,0.442666667 C1.12888889,0.18 0.706666667,0.176888889 0.444444444,0.435111111 C0.182222222,0.693333333 0.177777778,1.11555556 0.435555556,1.37777778 L7.00444444,8.04888889 L0.435555556,14.7204444 C0.177777778,14.9826667 0.182222222,15.4048889 0.444444444,15.6631111 C0.573333333,15.7906667 0.742222222,15.8546667 0.911111111,15.8546667 C1.08444444,15.8546667 1.25777778,15.788 1.38666667,15.6555556 L8.41333333,8.51688889 C8.67111111,8.25733333 8.67111111,7.84088889 8.41333333,7.58133333" />
        </g>
      </g>
    </svg>
  </Icon>
)
ArrowIcon.propTypes = {
  direction: PropTypes.oneOf(['down', 'up', 'left', 'right']),
}
ArrowIcon.defaultProps = {
  direction: 'right',
}

export default ArrowIcon
