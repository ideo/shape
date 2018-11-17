import PropTypes from 'prop-types'
import Icon from './Icon'

const ReportIcon = ({ size }) => {
  const viewBox = size === 'small' ? '0 0 15 15' : '-3 -3 22 22'
  return (
    <Icon fill>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        <path d="M14.1 12.8H1.5l2-3.6h.2c.3 0 .6-.2.8-.5l2.5 1c.1.4.4.6.8.6.5 0 .9-.4.9-.9v-.2l2.2-2.8c.1.1.3.1.4.1.5 0 .9-.4.9-.9s-.4-.9-.9-.9-.9.4-.9.9c0 .2.1.3.1.4L8.4 8.9c-.2-.1-.4-.2-.6-.2-.4 0-.8.2-.9.6l-2.4-1c0-.5-.4-.9-.9-.9s-.9.4-.9.9c.1.3.2.5.3.7l-1.8 3.3V2.1c0-.1-.1-.2-.2-.2s-.3.1-.3.2v11.2h13.4c.1 0 .2-.1.2-.2s-.1-.3-.2-.3z" />
      </svg>
    </Icon>
  )
}

ReportIcon.propTypes = {
  size: PropTypes.string,
}
ReportIcon.defaultProps = {
  size: 'small',
}

export default ReportIcon
