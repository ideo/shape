import PropTypes from 'prop-types'
import Icon from './Icon'

const SelectAllIcon = ({ viewBox }) => (
  <Icon fill>
    <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <g id="Layer_2_1_"></g>
      <g>
        <path
          d="M4.7,11.5c0.1,0.1,0.2,0.1,0.4,0.1s0.3,0,0.4-0.1L11,6c0.2-0.2,0.2-0.5,0-0.7s-0.5-0.2-0.7,0l-5.1,5.1L2.8,8
					C2.6,7.9,2.2,7.9,2,8S1.9,8.6,2,8.8L4.7,11.5z"
        />
        <path
          d="M14.2,0H2.8C2.3,0,2,0.3,2,0.8V2H0.8C0.3,2,0,2.3,0,2.8v11.4C0,14.7,0.3,15,0.8,15h11.4c0.5,0,0.8-0.3,0.8-0.8V13h1.2
					c0.5,0,0.8-0.3,0.8-0.8V0.8C15,0.3,14.7,0,14.2,0z M12,14H1V3h11V14z M14,12h-1V2.8C13,2.3,12.7,2,12.2,2H3V1h11V12z"
        />
      </g>
    </svg>
  </Icon>
)

SelectAllIcon.propTypes = {
  viewBox: PropTypes.string,
}

SelectAllIcon.defaultProps = {
  viewBox: '0 0 15 15',
}

export default SelectAllIcon
