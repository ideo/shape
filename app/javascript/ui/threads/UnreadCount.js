import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

import CommentIconFilled from '~/ui/icons/CommentIconFilled'

const CommentIconWrapper = styled.div`
  margin-left: 8px;
  margin-top: 5px;
  color: ${v.colors.alert};
  width: 18px;
  svg {
    height: 100%;
    width: 100%;

    text {
      font-size: 0.5rem;
      color: ${v.colors.white};
    }
  }
`

const UnreadCount = ({ count, size }) => {
  if (!count) return null

  return (
    <CommentIconWrapper size={size}>
      <CommentIconFilled text={count} textColor={v.colors.white} />
    </CommentIconWrapper>
  )
}

UnreadCount.propTypes = {
  count: PropTypes.string.isRequired,
  size: PropTypes.string,
}

UnreadCount.defaultProps = {
  size: 'small',
}

export default UnreadCount
