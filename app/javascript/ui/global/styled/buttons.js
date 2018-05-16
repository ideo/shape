import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

/** @component */
export const TopRightButton = styled.button`
  position: absolute;
  top: ${props => (props.size === 'sm' ? '5px' : '12px')};
  right: ${props => (props.size === 'sm' ? '10px' : '12px')};
  color: ${v.colors.cloudy};
  .icon {
    width: ${props => (props.size === 'sm' ? '12px' : '15px')};
    height: ${props => (props.size === 'sm' ? '12px' : '15px')};
  }

  &:hover {
    color: black;
  }
`
TopRightButton.displayName = 'TopRightButton'

export const CloseButton = ({ onClick, size }) => (
  <TopRightButton onClick={onClick} size={size}>
    <CloseIcon />
  </TopRightButton>
)
CloseButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'lg']),
  onClick: PropTypes.func.isRequired,
}
CloseButton.defaultProps = {
  size: 'sm',
}

export const CircledIcon = styled.button`
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
  ${props => props.active &&
    `background-color: ${v.colors.gray};`}

  &:hover {
    background-color: ${v.colors.gray};
  }

  .icon {
    height: 20px;
    width: 20px;
  }
`
CircledIcon.displayName = 'StyledCircledIcon'
