import PropTypes from 'prop-types'
import Icon from './Icon'

const TextIconXs = props => (
  <Icon fill>
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 16 16"
    >
      <path d="M6.5,3.8H2V1h12v2.8H9.6V15H6.5V3.8z" />
    </svg>
  </Icon>
)
TextIconXs.propTypes = {
  viewBox: PropTypes.string,
}
TextIconXs.defaultProps = {
  viewBox: '0 0 31 34',
}

export default TextIconXs
