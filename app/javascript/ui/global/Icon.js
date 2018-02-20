import PropTypes from 'prop-types'

const mapping = {
  circlePlus: 'B7',
  squarePlus: 'C7',
}

const Icon = ({ name, size, color }) => {
  // see if we've mapped this name above
  let iconName = mapping[name]
  // otherwise just use the passed name
  if (!iconName) iconName = name

  // NOTE: some icons require inner <span className="path1" ... />
  return (
    <span style={{ fontSize: size, color }} className={`icon-${iconName}`}>
      <span className="path1" />
      <span className="path2" />
      <span className="path3" />
      <span className="path4" />
      <span className="path5" />
    </span>
  )
}

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
