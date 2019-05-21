import PropTypes from 'prop-types'
import Icon from './Icon'

const FoamcoreBoardIcon = ({ large }) => (
  <Icon fill>
    {!large && (
      <svg viewBox="0 0 47 47">
        <path d="M17.2 14.6h2.9v2.7h-2.9zM17.2 18.7h2.9v2.7h-2.9zM21.7 14.6h2.9v2.7h-2.9zM21.7 25.7h2.9v2.7h-2.9zM17.2 29.8h2.9v2.7h-2.9zM26.1 29.8H29v2.7h-2.9zM21.7 29.8h2.9v2.7h-2.9z" />
        <path d="M36 14.8h-3.2v-1.4c0-1-.7-1.8-1.8-1.8H16c-1 0-1.8.7-1.8 1.8v20.2c0 1 .7 1.8 1.8 1.8h15c1 0 1.8-.7 1.8-1.8v-7.2h.1c.2 0 .4-.1.5-.2.5-.6 1.2-1.1 1.8-1.7.6-.6 1.3-1.2 1.8-1.8.1-.1.2-.3.2-.5V16c0-.6-.6-1.2-1.2-1.2zm-.3 7.1c-.1 0-.1 0 0 0h-2c-.8 0-1.3.7-1.3 1.3l-.2 1.7h-4.7v-8.6h8.2v5.6zm-4.5 11.7c0 .2-.1.2-.2.2H16c-.2 0-.2-.1-.2-.2V13.4c0-.2.1-.2.2-.2h15c.2 0 .2.1.2.2v1.4H27c-.6 0-1.1.5-1.1 1.1v9.3c0 .6.5 1.1 1.2 1.1h4.1v7.3z" />
      </svg>
    )}
    {large && (
      <svg viewBox="4 4 28 28">
        <path
          class="st0"
          d="M10.5 9.2h2.2v2.1h-2.2zM10.5 12.3h2.2v2.1h-2.2zM14 9.2h2.2v2.1H14zM14 17.7h2.2v2.1H14zM10.5 20.8h2.2v2.1h-2.2zM17.4 20.8h2.2v2.1h-2.2zM14 20.8h2.2v2.1H14z"
        />
        <path
          class="st0"
          d="M24.9 9.1h-2.3v-.9c0-.9-.6-1.5-1.5-1.5H9.6c-.9 0-1.4.6-1.4 1.5v15.6c0 .9.6 1.5 1.4 1.5h11.5c.9 0 1.5-.6 1.5-1.5v-5.6c.1 0 .3-.1.4-.2 1-.9 2-1.8 2.8-2.7.1-.1.2-.3.2-.4V10c-.1-.5-.5-.9-1.1-.9zm-.4 5.6c0 .1 0 .1 0 0l-1.5.1c-.6 0-1 .6-1 1V17h-3.6v-6.5h6.1v4.2zm-3.3 9.2H9.5V8.2v-.1h11.7v1h-3.1c-.5 0-.9.5-.9 1v7.2c0 .6.4 1 .9 1h3.1v5.6z"
        />
      </svg>
    )}
  </Icon>
)

FoamcoreBoardIcon.propTypes = {
  large: PropTypes.bool,
}

FoamcoreBoardIcon.defaultProps = {
  large: false,
}

export default FoamcoreBoardIcon
