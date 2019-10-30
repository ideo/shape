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
  }
`

const UnresolvedCount = ({ count, size }) => {
  if (!count) return null
  const unreadText = count < 100 ? count : `99+`

  return (
    <CommentIconWrapper size={size}>
      <CommentIconFilled text={unreadText} textColor={v.colors.white} />
    </CommentIconWrapper>
  )
}

UnresolvedCount.propTypes = {
  count: PropTypes.number.isRequired,
  size: PropTypes.string,
}

UnresolvedCount.defaultProps = {
  size: 'small',
}

UnresolvedCount.displayName = 'UnresolvedCount'

export default UnresolvedCount
