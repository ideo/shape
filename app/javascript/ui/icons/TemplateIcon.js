import PropTypes from 'prop-types'
import v from '~/utils/variables'
import Icon from './Icon'

const TemplateIcon = ({ circled, filled, viewBox }) => {
  let svg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
      <path d="M42.5 9.8H7.7c-1.3 0-2.3 1-2.3 2.3v25.3c0 1.3 1 2.3 2.3 2.3h34.8c1.3 0 2.3-1 2.3-2.3V12c0-1.2-1-2.2-2.3-2.2zm.7 2.2v16.1h-11V11.3h10.2c.5 0 .8.3.8.7zm-12.5 7.5H19.8v-8.2h10.9v8.2zm-10.9 1.6h10.9v17H19.8v-17zM6.9 37.4V12c0-.4.3-.7.7-.7h10.6v26.8H7.7c-.4 0-.8-.3-.8-.7zm35.6.7H32.3v-8.4h11v7.6c-.1.5-.4.8-.8.8z" />
    </svg>
  )

  if (circled) {
    svg = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        {filled &&
          <g id="Layer_2" data-name="Layer 2">
            <circle style={{ fill: v.colors.blackLava }} cx="25" cy="25" r="23.5" />
          </g>
        }
        <path style={{ fill: (filled ? '#fff' : '') }} d="M35.4 15.3H14c-.8 0-1.4.6-1.4 1.4v15.5c0 .8.6 1.4 1.4 1.4h21.5c.8 0 1.3-.6 1.3-1.3V16.7c0-.8-.6-1.4-1.4-1.4zm.4 1.4v9.8h-6.7V16.3h6.3c.3 0 .4.1.4.4zm-7.7 4.5h-6.7v-4.9h6.7v4.9zm-6.6 1.1h6.7v10.3h-6.7V22.3zm-7.9 9.9V16.7c0-.3.1-.4.4-.4h6.5v16.3H14c-.3 0-.4-.1-.4-.4zm21.9.4h-6.3v-5.1h6.7v4.7c-.1.3-.3.4-.4.4z" />
        <path style={{ fill: (filled ? '#fff' : '') }} d="M24.6 44.6c-10.9 0-19.8-8.9-19.8-19.8S13.7 4.9 24.6 4.9s19.8 8.9 19.8 19.8-8.8 19.9-19.8 19.9zm0-38.5C14.4 6.1 6 14.5 6 24.8 6 35 14.4 43.4 24.6 43.4S43.3 35 43.3 24.8c0-10.3-8.4-18.7-18.7-18.7z" />
      </svg>
    )
  }

  return (
    <Icon fill>
      {svg}
    </Icon>
  )
}

TemplateIcon.propTypes = {
  circled: PropTypes.bool,
  filled: PropTypes.bool,
  viewBox: PropTypes.string,
}
TemplateIcon.defaultProps = {
  circled: false,
  filled: false,
  viewBox: '0 0 50 50',
}

export default TemplateIcon
