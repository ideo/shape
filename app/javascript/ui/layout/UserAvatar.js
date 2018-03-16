import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledAvatar = styled.div`
  position: relative;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  width: ${props => `${props.size}px`};
  height: ${props => `${props.size}px`};
  margin-left: ${props => `${props.size * 0.15}px`};
  margin-right: ${props => `${props.size * 0.15}px`};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    text-align: center;
  }
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: ${props => props.size * 0.8}px;
    height: ${props => props.size * 0.8}px;
  }

`
StyledAvatar.displayName = 'StyledAvatar'

@observer
class UserAvatar extends React.Component {
  render() {
    const { user, className, size } = this.props
    return (
      <StyledAvatar
        size={size}
        className={className}
      >
        <img src={user.pic_url_square} title={user.name} alt={user.name} />
      </StyledAvatar>
    )
  }
}

UserAvatar.propTypes = {
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
}

UserAvatar.defaultProps = {
  size: 34,
  className: 'avatar',
}

export default UserAvatar
