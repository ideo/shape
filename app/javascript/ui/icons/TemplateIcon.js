import PropTypes from 'prop-types'
import v from '~/utils/variables'
import Icon from './Icon'

const TemplateIcon = ({ circled, filled, viewBox, size }) => {
  let svg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15">
      <path
        d="M12.8,2.8H2c-0.4,0-0.8,0.4-0.8,0.8v7.8C1.2,11.7,1.6,12,2,12h10.9c0.2,0,0.6-0.1,0.6-0.8V3.5C13.5,3.1,13.2,2.8,12.8,2.8z
 M1.8,11.3V3.5c0-0.1,0.1-0.2,0.2-0.2h10.8c0.1,0,0.2,0.1,0.2,0.2v5H9.8V3.3H9.2v2.6H5.9V3.3H5.4v8.2H2C1.9,11.5,1.8,11.5,1.8,11.3z
 M5.9,6.4h3.4v5.2H5.9V6.4z M12.9,11.5H9.8V9H13v2.2C13,11.5,13,11.5,12.9,11.5z"
      />
    </svg>
  )

  if (circled) {
    svg = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        {filled && (
          <g id="Layer_2" data-name="Layer 2">
            <circle style={{ fill: v.colors.black }} cx="25" cy="25" r="23.5" />
          </g>
        )}
        <path
          style={{ fill: filled ? '#fff' : '' }}
          d="M35.4 15.3H14c-.8 0-1.4.6-1.4 1.4v15.5c0 .8.6 1.4 1.4 1.4h21.5c.8 0 1.3-.6 1.3-1.3V16.7c0-.8-.6-1.4-1.4-1.4zm.4 1.4v9.8h-6.7V16.3h6.3c.3 0 .4.1.4.4zm-7.7 4.5h-6.7v-4.9h6.7v4.9zm-6.6 1.1h6.7v10.3h-6.7V22.3zm-7.9 9.9V16.7c0-.3.1-.4.4-.4h6.5v16.3H14c-.3 0-.4-.1-.4-.4zm21.9.4h-6.3v-5.1h6.7v4.7c-.1.3-.3.4-.4.4z"
        />
        <path
          style={{ fill: filled ? '#fff' : '' }}
          d="M24.6 44.6c-10.9 0-19.8-8.9-19.8-19.8S13.7 4.9 24.6 4.9s19.8 8.9 19.8 19.8-8.8 19.9-19.8 19.9zm0-38.5C14.4 6.1 6 14.5 6 24.8 6 35 14.4 43.4 24.6 43.4S43.3 35 43.3 24.8c0-10.3-8.4-18.7-18.7-18.7z"
        />
      </svg>
    )
  }

  return <Icon fill>{svg}</Icon>
}

TemplateIcon.propTypes = {
  circled: PropTypes.bool,
  filled: PropTypes.bool,
  viewBox: PropTypes.string,
  size: PropTypes.string,
}
TemplateIcon.defaultProps = {
  circled: false,
  filled: false,
  viewBox: '0 0 50 50',
  size: 'normal',
}

export default TemplateIcon
