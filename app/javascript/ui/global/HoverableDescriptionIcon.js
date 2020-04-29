import PropTypes from 'prop-types'
import InfoIconXs from '~/ui/icons/InfoIconXs'
import Tooltip from '~/ui/global/Tooltip'
import styled from 'styled-components'

const StyledIconWrapper = styled.span`
  margin-left: 4px;
  display: inline-block;
  vertical-align: middle;
  width: ${props => (props.width ? props.width : 10)}px;
`

const HoverableDescriptionIcon = ({ description, width }) => {
  return (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={description}
      placement="bottom"
    >
      <StyledIconWrapper width={width}>
        <InfoIconXs />
      </StyledIconWrapper>
    </Tooltip>
  )
}

HoverableDescriptionIcon.propTypes = {
  description: PropTypes.string.isRequired,
  width: PropTypes.number,
}

HoverableDescriptionIcon.defaultProps = {
  width: 10,
}

export default HoverableDescriptionIcon
