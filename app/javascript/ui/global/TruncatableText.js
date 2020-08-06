import { rightClamp } from '~/utils/textUtils'
import Tooltip from '~/ui/global/Tooltip'
import PropTypes from 'prop-types'

const TruncatableText = ({ text, maxLength }) => {
  if (!text) return null

  const shouldTruncate = text.length > maxLength
  const truncatedText = shouldTruncate ? rightClamp(text, maxLength) : text

  if (!shouldTruncate) return <span>{text}</span>

  return (
    <Tooltip classes={{ tooltip: 'Tooltip' }} title={text} placement="bottom">
      <span>{truncatedText}</span>
    </Tooltip>
  )
}

TruncatableText.propTypes = {
  text: PropTypes.string.isRequired,
  maxLength: PropTypes.number.isRequired,
}

export default TruncatableText
