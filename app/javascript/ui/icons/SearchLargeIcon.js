import PropTypes from 'prop-types'
import Icon from './Icon'

const SearchLargeIcon = ({ viewBox }) => (
  <Icon fill>
    <svg viewBox={viewBox}>
      <path
        d="M23.2,22.1l-3.6-3.2c0,0,0,0,0,0c0.9-1.1,1.4-2.5,1.4-3.9c0-3.4-2.7-6.2-6.2-6.3c-1.6,0-3.2,0.6-4.4,1.8s-1.8,2.7-1.9,4.4
	c0,1.7,0.6,3.2,1.8,4.4s2.7,1.8,4.4,1.9c0,0,0,0,0,0c1.4,0,2.8-0.5,3.9-1.4c0,0,0,0.1,0.1,0.1l3.6,3.2c0.1,0.1,0.3,0.2,0.4,0.2
	c0.2,0,0.4-0.1,0.5-0.2C23.5,22.8,23.5,22.4,23.2,22.1z M14.8,19.9C14.8,19.9,14.8,19.9,14.8,19.9c-1.4,0-2.6-0.5-3.5-1.5
	s-1.4-2.2-1.4-3.5s0.5-2.5,1.5-3.5c0.9-0.9,2.1-1.4,3.4-1.4c0,0,0,0,0,0c2.7,0,4.9,2.2,4.9,5c0,1.3-0.5,2.5-1.5,3.5
	C17.3,19.4,16.1,19.9,14.8,19.9z"
      />
    </svg>
  </Icon>
)

SearchLargeIcon.propTypes = {
  viewBox: PropTypes.string,
}

SearchLargeIcon.defaultProps = {
  viewBox: '0 0 32 32',
}

export default SearchLargeIcon
