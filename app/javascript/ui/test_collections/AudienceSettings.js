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
    disabled: true,
    selected: true,
    handleToggle: () => console.log('clicked'),
  },
  {
    value: 'filter',
    label: 'All People (No Filters)',
    disabled: false,
    selected: false,
    handleToggle: () => console.log('clicked'),
  },
]

const AudienceSettings = () => (
  <AudienceSettingsWrapper>
    <h3>Audience</h3>
    {options.map(option => (
      <AudienceSettingsRow
        handleToggle={() => console.log(`clicked button ${option.label}`)}
        checked={option.selected}
        value={option.value}
        label={option.label}
      />
    ))}
  </AudienceSettingsWrapper>
)

const AudienceSettingsWrapper = styled.div`
  /* display: grid; */
  max-width: 750px;
`

AudienceSettings.propTypes = {}

export default AudienceSettings
