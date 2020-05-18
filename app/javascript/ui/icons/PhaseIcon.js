import PropTypes from 'prop-types'
import Icon from './Icon'

const XsIcon = (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <path d="M12.2 8.9V7c0-.3-.2-.5-.5-.5H4c-.4 0-.6.3-.6.6v1.7c0 .4.3.6.6.6h7.7c.3 0 .5-.2.5-.5z" />
      <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM2.1 4.2H4V5H1.7c.1-.3.2-.5.4-.8zM8 15c-3.9 0-7-3.1-7-7 0-.7.1-1.4.3-2h3.2c.3 0 .5-.2.5-.5V3.7c0-.3-.2-.5-.5-.5H2.9C4.2 1.8 6 1 8 1c3.9 0 7 3.1 7 7 0 .7-.1 1.4-.3 2h-3.4c-.3 0-.5.2-.5.5v1.8c0 .3.2.5.5.5h1.8C11.8 14.2 10 15 8 15zm5.9-3.2h-2.1V11h2.5c-.1.3-.2.5-.4.8z" />
    </svg>
  </Icon>
)

const LargeIcon = (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <path d="M16 1.4C7.9 1.4 1.4 7.9 1.4 16S7.9 30.7 16 30.7 30.7 24.1 30.7 16 24.1 1.4 16 1.4zM4.6 9.1h3.7v1.7H3.7c.2-.5.5-1.1.9-1.7zM16 29.3c-7.4 0-13.4-6-13.4-13.3 0-1.3.2-2.6.6-3.9h5.7c.4 0 .6-.3.6-.6v-3c0-.4-.3-.6-.6-.6H5.4C7.9 4.7 11.7 2.6 16 2.6c7.4 0 13.3 6 13.3 13.4 0 1.3-.2 2.6-.6 3.9h-6.3c-.4 0-.7.3-.7.7v3c0 .4.3.7.7.7h4c-2.3 3-6.1 5-10.4 5zm11.4-6.5h-4.3v-1.7h5.2c-.2.6-.5 1.2-.9 1.7z" />
      <path d="M23.2 17.5v-3.1c0-.4-.3-.6-.7-.6H9c-.4 0-.8.3-.8.8v2.9c0 .4.3.8.8.8h13.5c.4-.1.7-.4.7-.8z" />
    </svg>
  </Icon>
)

const PhaseIcon = ({ large }) => (large ? LargeIcon : XsIcon)

PhaseIcon.propTypes = {
  large: PropTypes.bool,
}

PhaseIcon.defaultProps = {
  large: false,
}

export default PhaseIcon
