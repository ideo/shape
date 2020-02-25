import PropTypes from 'prop-types'
import InfoIconXs from '~/ui/icons/InfoIconXs'
import Tooltip from '~/ui/global/Tooltip'
import styled from 'styled-components'

const StyledIconWrapper = styled.span`
  margin-left: 3px;
  display: inline-block;
  width: 10px;
`

const HoverableDescriptionIcon = ({ description }) => {
  return (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={description}
      placement="bottom"
    >
      <StyledIconWrapper>
        <InfoIconXs />
      </StyledIconWrapper>
    </Tooltip>
  )
}

HoverableDescriptionIcon.propTypes = {
  description: PropTypes.string.isRequired,
}

export default HoverableDescriptionIcon
