import PropTypes from 'prop-types'
import Icon from './Icon'

const MenuIcon = ({ viewBox }) => (
  <Icon fill>
    <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(90 2.125 2.375)" fillRule="evenodd">
        <ellipse cx="1.75" cy="2" rx="1.75" ry="2" />
        <ellipse cx="8.75" cy="2" rx="1.75" ry="2" />
        <ellipse cx="15.75" cy="2" rx="1.75" ry="2" />
      </g>
    </svg>
  </Icon>
)

MenuIcon.propTypes = {
  viewBox: PropTypes.string,
}
MenuIcon.defaultProps = {
  viewBox: '0 0 5 18',
}

export default MenuIcon
