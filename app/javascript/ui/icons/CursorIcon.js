import PropTypes from 'prop-types'
import Icon from './Icon'

const CursorIcon = ({ color }) => (
  <Icon fill>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <g>
        <path
          fill={color}
          d="M7.9,0.9l19.7,20.2c0.5,0.5,0.1,1.4-0.6,1.4H16.2c-0.2,0-0.4,0.1-0.6,0.2l-7.7,7.7c-0.5,0.5-1.4,0.2-1.4-0.6
        l0-28.4C6.5,0.7,7.4,0.3,7.9,0.9z"
        />
        <path
          fill={color}
          d="M7.3,31.1c-0.2,0-0.3,0-0.5-0.1c-0.5-0.2-0.8-0.6-0.8-1.1V1.5c0-0.5,0.3-0.9,0.8-1.1c0.5-0.2,1-0.1,1.3,0.3
        l19.7,20.2c0.3,0.4,0.4,0.9,0.3,1.3c-0.2,0.5-0.6,0.7-1.1,0.7H16.2c-0.1,0-0.2,0-0.3,0.1l-7.7,7.7C8,30.9,7.6,31.1,7.3,31.1z
         M7.3,1.1c-0.1,0-0.1,0-0.2,0c-0.1,0-0.3,0.1-0.3,0.4v28.4c0,0.3,0.2,0.4,0.3,0.4s0.3,0.1,0.5-0.1l7.7-7.7c0.2-0.2,0.5-0.4,0.9-0.4
        H27c0.3,0,0.4-0.2,0.4-0.3c0-0.1,0.1-0.3-0.1-0.5L7.6,1.2C7.5,1.1,7.4,1.1,7.3,1.1z"
        />
      </g>
    </svg>
  </Icon>
)

CursorIcon.propTypes = {
  color: PropTypes.string.isRequired,
}

export default CursorIcon