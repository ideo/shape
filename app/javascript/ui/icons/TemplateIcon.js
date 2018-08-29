import PropTypes from 'prop-types'
import v from '~/utils/variables'
import Icon from './Icon'

const TemplateIcon = ({ circled, filled, viewBox }) => {
  let svg = (
    <svg viewBox="0 0 32 32">
      <path d="M23.1,9.6H8.9c-0.7,0-1.2,0.5-1.2,1.2v10.3c0,0.7,0.5,1.2,1.2,1.2h14.3c0.7,0,1.2-0.5,1.2-1.2V10.8
        C24.4,10.2,23.8,9.6,23.1,9.6z M23.1,17.1h-3.8v-6.2l3.8,0V17.1z M18,13.6h-3.8v-2.7l3.8,0V13.6z M14.2,14.9H18v6.3l-3.8,0V14.9z
        M8.9,10.9l4,0v10.2l-3.9,0L8.9,10.9z M19.3,21.1v-2.8h3.8v2.7L19.3,21.1z"
      />
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
