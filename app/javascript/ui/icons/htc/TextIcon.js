import PropTypes from 'prop-types'
import Icon from '../Icon'

const TextIcon = props => (
  <Icon fill>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
      <path d="M18.1,11.2H6.6V4h30.9v7.2H26.1V40h-8V11.2z" />
    </svg>
  </Icon>
)
TextIcon.propTypes = {
  viewBox: PropTypes.string,
}
TextIcon.defaultProps = {
  viewBox: '0 0 31 34',
}

export default TextIcon
