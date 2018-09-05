import PropTypes from 'prop-types'

import v from '~/utils/variables'
import Icon from './Icon'

const TestCollectionIcon = ({ size }) => (
  <Icon fill>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={size === 'large' ? '0 0 32 32' : '-4 -4 40 40'}
    >
      <circle cx="99.8" cy="-50.6" r="23.5" />
      <path className="st0" d="M87.7-43.6c-1.2-2.1-1.9-4.5-1.9-7 0-5.6 3.3-10.4 8-12.7M112-43.6c-2.4 4.2-6.9 7-12.1 7-2.9 0-5.6-.9-7.8-2.4M99.8-64.6c7.7 0 14 6.3 14 14v1.1" />
      <path className="st1" d="M91.7-59.2l2.1-4.1-4.5.2M116-53.5l-2.2 4-2.4-3.9M94.4-35.1L92-39l4.6-.1" />
      <path className="st2" d="M93.5-45.8h12.7M95.3-45.9v-3M98.2-45.9V-52M101.1-45.9v-9.5M104.1-45.9v-5" />
      <circle cx="-36.3" cy="-50.6" r="23.5" />
      <circle cx="-36.3" cy="-50.6" r="14" fill="none" stroke={v.colors.orange} strokeWidth="1.5" strokeMiterlimit="10" />
      <path className="st2" d="M-42.6-46.8H-30M-40.8-46.9v-3M-37.9-46.9V-53M-35-46.9v-9.5M-32.1-46.9v-5" />
      <g>
        <circle cx="-91.8" cy="-50.6" r="23.5" />
      </g>
      <path d="M20.4 18.6v-3.9h-1.3v3.9h-1.3v-7.9h-1.3v7.9h-1.3v-4.8h-1.3v4.8h-1.3v-2.1h-1.3v2.1h-.9v1.3h11.2v-1.3z" />
      <path className="st4" style={{ fill: v.colors.orange }} d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 23.3c-5.2 0-9.3-4.2-9.3-9.3 0-5.2 4.2-9.3 9.3-9.3s9.3 4.2 9.3 9.3c-.1 5.2-4.3 9.3-9.3 9.3z" />
      <g>
        <path className="st5" d="M-34.6 19.8H-22M-32.8 19.7v-3M-29.9 19.7v-6.1M-27 19.7v-9.5M-24.1 19.7v-5" />
      </g>
      <path className="st4" style={{ fill: v.colors.orange }} d="M-28.8 0c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 26.6c-5.9 0-10.6-4.8-10.6-10.6 0-5.9 4.8-10.6 10.6-10.6s10.6 4.8 10.6 10.6c0 5.9-4.8 10.6-10.6 10.6z" />
      <g>
        <circle cx="19.3" cy="-50.9" r="23.5" />
        <g id="XMLID_1_">
          <path className="st4" style={{ fill: v.colors.orange }} d="M19.3-35.4c-8.5 0-15.5-6.9-15.5-15.5s6.9-15.5 15.5-15.5 15.5 6.9 15.5 15.5-7 15.5-15.5 15.5zm0-26.7c-6.2 0-11.2 5-11.2 11.2s5 11.2 11.2 11.2 11.2-5 11.2-11.2-5-11.2-11.2-11.2z" />
          <path className="st4" style={{ fill: v.colors.orange }} d="M19.3-34.9c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16c.1 8.8-7.1 16-16 16zm0-30.9c-8.2 0-14.9 6.7-14.9 14.9S11.1-36 19.3-36s14.9-6.7 14.9-14.9-6.7-14.9-14.9-14.9zm0 26.6c-6.5 0-11.7-5.3-11.7-11.7 0-6.5 5.3-11.7 11.7-11.7 6.5 0 11.7 5.3 11.7 11.7 0 6.5-5.2 11.7-11.7 11.7zm0-22.3c-5.8 0-10.6 4.7-10.6 10.6 0 5.8 4.7 10.6 10.6 10.6 5.8 0 10.6-4.7 10.6-10.6 0-5.9-4.8-10.6-10.6-10.6z" />
        </g>
      </g>
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
