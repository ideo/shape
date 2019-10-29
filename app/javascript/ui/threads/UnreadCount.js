import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

import CommentIconFilled from '~/ui/icons/CommentIconFilled'

const CommentIconWrapper = styled.div`
  color: ${v.colors.alert};
  width: 18px;
  svg {
    height: ${props => (props.size === 'small' ? 100 : 120)}%;
    width: ${props => (props.size === 'small' ? 100 : 120)}%;

    text {
      font-family: Gotham;
      font-size: 40%;
      font-weight: 500;
      color: ${v.colors.commonLight};
    }
  }
`

const UnreadCount = ({ count, size }) => {
  if (!count) return null
  const unreadText = count < 100 ? count : `99+`

  return (
    <CommentIconWrapper size={size}>
      <CommentIconFilled text={unreadText} textColor={v.colors.white} />
    </CommentIconWrapper>
  )
}

UnreadCount.propTypes = {
  count: PropTypes.number.isRequired,
  size: PropTypes.string,
}

UnreadCount.defaultProps = {
  size: 'small',
}

UnreadCount.displayName = 'UnreadCount'

export default UnreadCount
