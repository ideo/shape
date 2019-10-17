import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

import CommentIconFilled from '~/ui/icons/CommentIconFilled'

const CommentIconWrapper = styled.div`
  color: ${v.colors.alert};
  ${'' /* Height and width of rectangle are being set in the icon? */}
  height: ${props => (props.size === 'small' ? 16 : 32)}px;
  width: ${props => (props.size === 'small' ? 16 : 32)}px;
  margin-left: 8px;
  margin-top: 5px;
  svg {
    margin-left: 4px;
    height: 100%;
    width: 100%;
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
