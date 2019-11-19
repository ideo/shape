import styled from 'styled-components'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Tooltip from '~/ui/global/Tooltip'
import UnresolvedCount from '~/ui/threads/UnresolvedCount'

const StyledUnresolvedButton = styled.button`
  position: relative;
  bottom: 10%;
  ${props => props.hasNoOtherIcons && `left: 8px;`}
`

const UnresolvedButton = ({
  record,
  onClick,
  hasNoOtherIcons,
  IconWrapper,
}) => {
  let wrappedIcon = (
    <UnresolvedCount count={record.unresolved_count} size={'large'} />
  )

  if (IconWrapper) {
    wrappedIcon = <IconWrapper>{wrappedIcon}</IconWrapper>
  }
  return (
    <Tooltip title={'Add comment'} placement="top">
      <StyledUnresolvedButton
        onClick={onClick}
        hasNoOtherIcons={hasNoOtherIcons}
      >
        {wrappedIcon}
      </StyledUnresolvedButton>
    </Tooltip>
  )
}

UnresolvedButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  onClick: PropTypes.func.isRequired,
  hasNoOtherIcons: PropTypes.bool.isRequired,
  IconWrapper: PropTypes.func,
}

UnresolvedButton.defaultProps = {
  IconWrapper: null,
}

export default UnresolvedButton
