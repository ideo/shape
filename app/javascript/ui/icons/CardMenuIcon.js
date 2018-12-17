import PropTypes from 'prop-types'
import Icon from './Icon'

const CardMenuIcon = ({ viewBox }) => (
  <Icon fill>
    <svg viewBox="0 0 32 32">
      <rect
        id="guide"
        x="3"
        y="3.8"
        style={{ display: 'none', opacity: 0.5 }}
        width="26"
        height="24.4"
      />
      <g id="Group-2">
        <circle id="Oval-3" cx="16" cy="6.4" r="2.5" />
        <circle id="Oval-3-Copy" cx="16" cy="16" r="2.5" />
        <circle id="Oval-3-Copy-2" cx="16" cy="25.7" r="2.5" />
      </g>
    </svg>
  </Icon>
)

CardMenuIcon.propTypes = {
  viewBox: PropTypes.string,
}
CardMenuIcon.defaultProps = {
  viewBox: '0 0 5 18',
}

export default CardMenuIcon
