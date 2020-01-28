import v from '~/utils/variables'
import Icon from './Icon'

const TestCollectionIcon = () => (
  <Icon fill>
    <svg viewBox="0 0 32 32">
      <path d="M20.4 18.6v-3.9h-1.3v3.9h-1.3v-7.9h-1.3v7.9h-1.3v-4.8h-1.3v4.8h-1.3v-2.1h-1.3v2.1h-.9v1.3h11.2v-1.3z" />
      <path
        d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 23.3c-5.2 0-9.3-4.2-9.3-9.3 0-5.2 4.2-9.3 9.3-9.3s9.3 4.2 9.3 9.3c-.1 5.2-4.3 9.3-9.3 9.3z"
        style={{ fill: v.colors.alert }}
      />
    </svg>
  </Icon>
)

export default TestCollectionIcon
