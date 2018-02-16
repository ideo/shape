import PropTypes from 'prop-types'

const Icon = ({ name, size, color }) => (
  // NOTE: some icons require inner <span className="path1" ... />
  <span style={{ fontSize: size, color }} className={`icon-${name}`} />
)

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.string,
  color: PropTypes.string,
}

Icon.defaultProps = {
  size: '1rem',
  color: 'inherit',
}

export default Icon
