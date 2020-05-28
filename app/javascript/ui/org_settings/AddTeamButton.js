import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useState } from 'react'
// import { v4 as uuidv4 } from 'uuid'

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

// const generateFakeId = () => {
//   const number = uuidv4() // TODO: replace with incrementingId based on business units?
//   return `Team ${number}`
// }

// TODO: convert to class using observable?
const AddTeamButton = ({ createBusinessUnit }) => {
  const [showInput, setShowInput] = useState(false)
  // TODO: figure out how to allow editing text field
  // Maybe show value and conditionally show placeholder/default?
  const [inputValue, setInputValue] = useState('')

  const handleKeyPress = e => {
    console.log('pressed: ', e.key)
    setInputValue(e.target.value)
    if (e.key === 'Enter') {
      handleSaveBusinessUnit()
    }
    console.log(e.target.value)
  }

  const handleSaveBusinessUnit = e => {
    e.preventDefault()
    console.log('saving BU')
  }

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
      {showInput && (
        <TextField value={inputValue} onKeyPress={handleKeyPress} />
      )}
    </React.Fragment>
  )
}

AddTeamButton.propTypes = {
  createBusinessUnit: PropTypes.func.isRequired,
}

export default AddTeamButton
