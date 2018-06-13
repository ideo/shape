import PropTypes from 'prop-types'
import Icon from './Icon'

const CollectionIcon = (props) => (
  <Icon fill>
    <svg viewBox={props.viewBox} xmlns="http://www.w3.org/2000/svg">
      <g fillRule="evenodd">
        <path d="M140 127V74a3 3 0 0 0-3-3H63v-5a3 3 0 0 1 3-3h79a3 3 0 0 1 3 3v58a3 3 0 0 1-3 3h-5z" />
        <path d="M151 116V63a3 3 0 0 0-3-3H74v-5a3 3 0 0 1 3-3h79a3 3 0 0 1 3 3v58a3 3 0 0 1-3 3h-5z" />
        <path d="M52 77v58a3 3 0 0 0 3 3h79a3 3 0 0 0 3-3V77a3 3 0 0 0-3-3H55a3 3 0 0 0-3 3z" />
      </g>
    </svg>
  </Icon>
)
CollectionIcon.propTypes = {
  viewBox: PropTypes.string,
}
CollectionIcon.defaultProps = {
  viewBox: '0 0 200 200'
}

export default CollectionIcon
