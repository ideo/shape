import PropTypes from 'prop-types'
import Icon from './Icon'

const CollectionIconSm = props => (
  <Icon fill>
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 16 16"
      xmlSpace="preserve"
    >
      <g id="Symbols">
        <g id="collection-icon">
          <g id="Group" transform="translate(52.000000, 52.000000)">
            <path
              id="Combined-Shape"
              className="st0"
              d="M-39.3-39.6v-7.2c0-0.2-0.2-0.4-0.4-0.4h-10.1v-0.7c0-0.2,0.2-0.4,0.4-0.4h10.8
				c0.2,0,0.4,0.2,0.4,0.4v7.9c0,0.2-0.2,0.4-0.4,0.4C-38.6-39.6-39.3-39.6-39.3-39.6z"
            />
            <path
              id="Combined-Shape-Copy"
              className="st0"
              d="M-37.7-41.1v-7.2c0-0.2-0.2-0.4-0.4-0.4h-10.1v-0.7c0-0.2,0.2-0.4,0.4-0.4h10.8
				c0.2,0,0.4,0.2,0.4,0.4v7.9c0,0.2-0.2,0.4-0.4,0.4C-37.1-41.1-37.7-41.1-37.7-41.1z"
            />
            <path
              id="Path-3"
              className="st0"
              d="M-51.3-46.5v7.9c0,0.2,0.2,0.4,0.4,0.4h10.8c0.2,0,0.4-0.2,0.4-0.4v-7.9c0-0.2-0.2-0.4-0.4-0.4
				h-10.8C-51.1-46.9-51.3-46.7-51.3-46.5z"
            />
          </g>
        </g>
      </g>
    </svg>
  </Icon>
)
CollectionIconSm.propTypes = {
  viewBox: PropTypes.string,
}
CollectionIconSm.defaultProps = {
  viewBox: '0 0 200 200',
}

export default CollectionIconSm
