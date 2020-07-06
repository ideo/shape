import PropTypes from 'prop-types'
import Icon from '../Icon'

// this icon is circled e.g. for Collection Type selector and breadcrumb
const FoamcoreBoardIconXs = () => (
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
      <g>
        <rect x="5.1" y="4.2" width="1.2" height="1.2" />
        <rect x="5.1" y="6" width="1.2" height="1.2" />
        <rect x="7" y="4.2" width="1.2" height="1.2" />
        <rect x="7" y="8.9" width="1.2" height="1.2" />
        <rect x="5.1" y="10.7" width="1.2" height="1.2" />
        <rect x="8.9" y="10.7" width="1.2" height="1.2" />
        <rect x="7" y="10.7" width="1.2" height="1.2" />
        <path
          d="M13.1,4.1h-1.2V3.7c0-0.6-0.4-0.9-0.9-0.9H4.6c-0.6,0-0.9,0.4-0.9,0.9v8.6c0,0.6,0.4,0.9,0.9,0.9H11c0.6,0,0.9-0.4,0.9-0.9
		v-3c0.1,0,0.1-0.1,0.2-0.1c0.5-0.5,1.1-1,1.5-1.5c0.1-0.1,0.1-0.2,0.1-0.3V4.7C13.7,4.4,13.4,4.1,13.1,4.1z M12.7,7.3
		C12.7,7.3,12.7,7.3,12.7,7.3l-0.7,0.1c-0.3,0-0.6,0.3-0.6,0.6l0,0.5H9.6V5.1h3.1V7.3z M4.7,12.2l0-8.5l6.2,0v0.3H9.3
		C9,4.1,8.6,4.4,8.6,4.7v4c0,0.4,0.3,0.7,0.7,0.7h1.6l0,2.9L4.7,12.2z"
        />
        <path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M8,15c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S11.9,15,8,15z" />
      </g>
    </svg>
  </Icon>
)

const FoamcoreBoardIconMd = () => (
  <Icon fill>
    <svg viewBox="0 0 47 47">
      <path d="M17.2 14.6h2.9v2.7h-2.9zM17.2 18.7h2.9v2.7h-2.9zM21.7 14.6h2.9v2.7h-2.9zM21.7 25.7h2.9v2.7h-2.9zM17.2 29.8h2.9v2.7h-2.9zM26.1 29.8H29v2.7h-2.9zM21.7 29.8h2.9v2.7h-2.9z" />
      <path d="M36 14.8h-3.2v-1.4c0-1-.7-1.8-1.8-1.8H16c-1 0-1.8.7-1.8 1.8v20.2c0 1 .7 1.8 1.8 1.8h15c1 0 1.8-.7 1.8-1.8v-7.2h.1c.2 0 .4-.1.5-.2.5-.6 1.2-1.1 1.8-1.7.6-.6 1.3-1.2 1.8-1.8.1-.1.2-.3.2-.5V16c0-.6-.6-1.2-1.2-1.2zm-.3 7.1c-.1 0-.1 0 0 0h-2c-.8 0-1.3.7-1.3 1.3l-.2 1.7h-4.7v-8.6h8.2v5.6zm-4.5 11.7c0 .2-.1.2-.2.2H16c-.2 0-.2-.1-.2-.2V13.4c0-.2.1-.2.2-.2h15c.2 0 .2.1.2.2v1.4H27c-.6 0-1.1.5-1.1 1.1v9.3c0 .6.5 1.1 1.2 1.1h4.1v7.3z" />
    </svg>
  </Icon>
)

const FoamcoreBoardIconLg = () => (
  <Icon fill>
    <svg viewBox="4 4 28 28">
      <path
        className="st0"
        d="M10.5 9.2h2.2v2.1h-2.2zM10.5 12.3h2.2v2.1h-2.2zM14 9.2h2.2v2.1H14zM14 17.7h2.2v2.1H14zM10.5 20.8h2.2v2.1h-2.2zM17.4 20.8h2.2v2.1h-2.2zM14 20.8h2.2v2.1H14z"
      />
      <path
        className="st0"
        d="M24.9 9.1h-2.3v-.9c0-.9-.6-1.5-1.5-1.5H9.6c-.9 0-1.4.6-1.4 1.5v15.6c0 .9.6 1.5 1.4 1.5h11.5c.9 0 1.5-.6 1.5-1.5v-5.6c.1 0 .3-.1.4-.2 1-.9 2-1.8 2.8-2.7.1-.1.2-.3.2-.4V10c-.1-.5-.5-.9-1.1-.9zm-.4 5.6c0 .1 0 .1 0 0l-1.5.1c-.6 0-1 .6-1 1V17h-3.6v-6.5h6.1v4.2zm-3.3 9.2H9.5V8.2v-.1h11.7v1h-3.1c-.5 0-.9.5-.9 1v7.2c0 .6.4 1 .9 1h3.1v5.6z"
      />
    </svg>
  </Icon>
)

const FoamcoreBoardIcon = ({ size }) => {
  if (size === 'lg') return <FoamcoreBoardIconLg />
  if (size === 'xs') return <FoamcoreBoardIconXs />
  return <FoamcoreBoardIconMd />
}

FoamcoreBoardIcon.propTypes = {
  size: PropTypes.string,
}

FoamcoreBoardIcon.defaultProps = {
  size: 'md',
}

export default FoamcoreBoardIcon
