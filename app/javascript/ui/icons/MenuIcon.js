import { propTypes, defaultProps } from './iconProps'

const MenuIcon = ({ color, width, height }) => (
  <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(1 1)" fill={color} fillRule="evenodd">
      <circle cx="1" cy="1" r="1" />
      <circle cx="5" cy="1" r="1" />
      <circle cx="9" cy="1" r="1" />
    </g>
  </svg>
)

MenuIcon.propTypes = { ...propTypes }
MenuIcon.defaultProps = { ...defaultProps }

export default MenuIcon
