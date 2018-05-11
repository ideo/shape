import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

/** @component */
export const TopRightButton = styled.button`
  position: absolute;
  top: 5px;
  right: 10px;
  color: ${v.colors.cloudy};
  .icon {
    width: 12px;
    height: 12px;
  }

  &:hover {
    color: black;
  }
`
TopRightButton.displayName = 'TopRightButton'

export const CloseButton = ({ onClick }) => (
  <TopRightButton onClick={onClick}>
    <CloseIcon />
  </TopRightButton>
)
CloseButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}
