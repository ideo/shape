import PropTypes from 'prop-types'
import Icon from './Icon'

const TextIcon = (props) => (
  <Icon fill>
    <svg viewBox={props.viewBox} version="1.1" xmlns="http://www.w3.org/2000/svg">
      <title>Text</title>
      <g>
        <g>
          <path d="M7.6,33.7 L7.6,31 L13.4,31 L13.4,2.7 L8.9,2.7 C5,2.7 4.5,4.1 2.8,11.9 L0.9,11.9 L0.9,0.3 L30.4,0.3 L30.4,11.9 L28.5,11.9 C26.8,4.2 26.2,2.7 22.3,2.7 L17.8,2.7 L17.8,31 L23.6,31 L23.6,33.7 C23.6,33.7 7.6,33.7 7.6,33.7 Z" />
        </g>
      </g>
    </svg>
  </Icon>
)
TextIcon.propTypes = {
  viewBox: PropTypes.string,
}
TextIcon.defaultProps = {
  viewBox: '0 0 31 34'
}

export default TextIcon
