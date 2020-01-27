import PropTypes from 'prop-types'

import v from '~/utils/variables'
import Icon from './Icon'

const TestCollectionIcon = ({ size }) => (
  <Icon fill>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={size === 'large' ? '0 0 32 32' : '-4 -4 40 40'}
    >
      <path
        className="st1"
        d="M91.7-59.2l2.1-4.1-4.5.2M116-53.5l-2.2 4-2.4-3.9M94.4-35.1L92-39l4.6-.1"
      />
      <path
        className="st2"
        d="M93.5-45.8h12.7M95.3-45.9v-3M98.2-45.9V-52M101.1-45.9v-9.5M104.1-45.9v-5"
      />
      <path
        className="st2"
        d="M-42.6-46.8H-30M-40.8-46.9v-3M-37.9-46.9V-53M-35-46.9v-9.5M-32.1-46.9v-5"
      />
      <path d="M20.4 18.6v-3.9h-1.3v3.9h-1.3v-7.9h-1.3v7.9h-1.3v-4.8h-1.3v4.8h-1.3v-2.1h-1.3v2.1h-.9v1.3h11.2v-1.3z" />
      <path
        className="st4"
        style={{ fill: v.colors.alert }}
        d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 23.3c-5.2 0-9.3-4.2-9.3-9.3 0-5.2 4.2-9.3 9.3-9.3s9.3 4.2 9.3 9.3c-.1 5.2-4.3 9.3-9.3 9.3z"
      />
    </svg>
  </Icon>
)

TestCollectionIcon.propTypes = {
  size: PropTypes.string,
}

TestCollectionIcon.defaultProps = {
  size: 'large',
}

export default TestCollectionIcon
