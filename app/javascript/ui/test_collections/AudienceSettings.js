import React from 'react'
// import { PropTypes } from 'prop-types'
import styled from 'styled-components'
import FormControl from '@material-ui/core/FormControl'
import AudienceSettingsRow from '~/ui/global/AudienceSettingsRow'

// Should TestDesigner.js pass this as a prop?
const options = [
  {
    value: 'link',
    label: 'Share via link (on)',
    disabled: false,
    // Should this be a function?
  },
  {
    value: 'filter',
    label: 'All People (No Filters)',
    disabled: false,
    // Should this be a function?
  },
]

const AudienceSettings = () => {
  return (
    <div>
      <h3>Audience</h3>
      <StyledAudienceGrid>
        <StyledForm>
          <FormControl component="fieldset" required>
            {options.map(option => (
              <AudienceSettingsRow
                key={option.value}
                handleToggle={() =>
                  console.log(`clicked button ${option.label}`)
                }
                checked={false}
                value={option.value}
                label={option.label}
              />
            ))}
          </FormControl>
        </StyledForm>
      </StyledAudienceGrid>
    </div>
  )
}

const StyledAudienceGrid = styled.div`
  display: grid;
`
// maxWidth mainly to force the radio buttons from spanning the page
const StyledForm = styled.form`
  max-width: 750px;
`

AudienceSettings.propTypes = {}

export default AudienceSettings
