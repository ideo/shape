import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import Tooltip from '~/ui/global/Tooltip'

const StyledIconWrapper = styled.span`
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
  width: ${props => (props.width ? props.width : 10)}px;
`

const AddTeamButton = ({ handleClick }) => {
  return (
    <React.Fragment>
      <Tooltip
        classes={{
          tooltip: 'Tooltip',
        }}
        title={'Add new team'}
        placement="bottom"
      >
        <StyledIconWrapper width={30} onClick={handleClick}>
          <PlusCircleIcon fillColor={v.colors.cDeltaBlue} />
        </StyledIconWrapper>
      </Tooltip>
    </React.Fragment>
  )
}

AddTeamButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
}

export default AddTeamButton
