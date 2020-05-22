import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useState } from 'react'

import v from '~/utils/variables'
import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import Tooltip from '~/ui/global/Tooltip'
import { TextField } from '~/ui/global/styled/forms'

const StyledIconWrapper = styled.span`
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
  width: ${props => (props.width ? props.width : 10)}px;
`

const AddTeamButton = ({ createBusinessUnit }) => {
  const [showInput, setShowInput] = useState(false)

  return (
    <React.Fragment>
      <Tooltip
        classes={{
          tooltip: 'Tooltip',
        }}
        title={'Add new team'}
        placement="bottom"
      >
        <StyledIconWrapper width={30} onClick={() => setShowInput(true)}>
          <PlusCircleIcon fillColor={v.colors.cDeltaBlue} />
        </StyledIconWrapper>
      </Tooltip>
      {/*
      The BU will be named automatically as "Team {incremental number}"
      which will be displayed in an active highlighted text field.As such,
        if the user types, they will overwrite the name.

        Need to autofocus this field
        Need to populate it with Team X value (not placeholder)
        Need to handle Enter to close and save
       */}
      {showInput && <TextField />}
    </React.Fragment>
  )
}

AddTeamButton.propTypes = {
  createBusinessUnit: PropTypes.func.isRequired,
}

export default AddTeamButton
