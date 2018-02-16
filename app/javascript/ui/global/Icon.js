import PropTypes from 'prop-types'

const Icon = ({ name, size }) => (
  <span style={{ fontSize: size }} className={`icon-${name}`} />
)

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.string,
}

Icon.defaultProps = {
  size: '1rem'
}

export default Icon
