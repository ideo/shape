import PropTypes from 'prop-types'
import ifEmoji from 'if-emoji'
import styled from 'styled-components'

import EmojiDarkSunglasses from '~/assets/emoji/dark-sunglasses.png'
import EmojiEyeglasses from '~/assets/emoji/eyeglasses.png'
import EmojiExplodingHead from '~/assets/emoji/exploding-head_1f92f.png'
import EmojiSlightlySmilingFace from '~/assets/emoji/slightly-smiling-face.png'
import EmojiWomanShrugging from '~/assets/emoji/woman-shrugging.png'
import EmojiError from '~/assets/emoji/error.png'
import trackError from '~/utils/trackError'

const emojiFallbackMap = {
  '🤯': EmojiExplodingHead,
  '🤷‍♀️': EmojiWomanShrugging,
  '🕶': EmojiDarkSunglasses,
  '👓': EmojiEyeglasses,
  '🙂': EmojiSlightlySmilingFace,
}

function emojiFallback(symbol) {
  const fallback = emojiFallbackMap[symbol]
  if (!fallback) {
    trackError(new Error(`Missing emoji: ${symbol}`), {
      source: 'Emoji',
      name: 'emojiFallback',
    })
    return EmojiError
  }
  return fallback
}

const EmojiImage = styled.img`
  display: inline-block;
  vertical-align: bottom;
`

const Emoji = props => {
  const { name, symbol, scale } = props
  return ifEmoji(symbol) ? (
    <span
      className="emoji"
      role="img"
      aria-label={name || ''}
      aria-hidden={name ? 'false' : 'true'}
      style={{ fontSize: `${parseInt(32 * scale)}px` }}
    >
      {symbol}
    </span>
  ) : (
    <EmojiImage
      style={{ width: `${parseInt(32 * scale)}px` }}
      src={emojiFallback(symbol)}
      alt={name}
    />
  )
}

Emoji.propTypes = {
  name: PropTypes.string,
  symbol: PropTypes.string,
  scale: PropTypes.number,
}
Emoji.defaultProps = {
  name: null,
  symbol: null,
  scale: 1,
}

export default Emoji
