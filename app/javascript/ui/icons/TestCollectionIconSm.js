import v from '~/utils/variables'
import Icon from './Icon'

const TestCollectionIconSm = () => (
  <Icon fill>
    <svg x="0px" y="0px" viewBox="0 0 47 47">
      <g style={{ fill: v.colors.transparent }}>
        <circle cx="23.5" cy="23.5" r="23.5" />
      </g>
      <polygon
        style={{ fill: v.colors.white }}
        className="st0"
        points="28.5,26.6 28.5,22.2 27,22.2 27,26.6 25.6,26.6 25.6,17.7 24.1,17.7 24.1,26.6 22.6,26.6 22.6,21.1
    21.1,21.1 21.1,26.6 19.7,26.6 19.7,24.2 18.2,24.2 18.2,26.6 17.2,26.6 17.2,28.1 29.8,28.1 29.8,26.6 "
      />
      <path
        style={{ fill: v.colors.alert }}
        className="st1"
        d="M23.5,7.5c-8.8,0-16,7.2-16,16s7.2,16,16,16s16-7.2,16-16S32.3,7.5,23.5,7.5z M23.5,34.1
  	c-5.8,0-10.6-4.7-10.6-10.6c0-5.8,4.7-10.6,10.6-10.6s10.6,4.7,10.6,10.6C34.1,29.3,29.3,34.1,23.5,34.1z"
      />
    </svg>
  </Icon>
)

export default TestCollectionIconSm
