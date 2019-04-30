import React from 'react'
import { PropTypes } from 'prop-types'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import styled from 'styled-components'
import v from '~/utils/variables'

const AudienceSettingsRow = ({ checked, label, value, handleToggle }) => (
  <StyledRowFlexParent>
    <LabelContainer
      classes={{ label: 'form-control' }}
      labelPlacement={'end'}
      control={
        <Checkbox
          checked={checked}
          onChange={handleToggle}
          value={value}
          color={'default'}
          iconStyle={{ fill: 'black' }}
        />
      }
      label={
        <div style={{ maxWidth: '582px' }}>
          <StyledLabel>{label}</StyledLabel>
        </div>
      }
    />
    <StyledRowFlexItem>–</StyledRowFlexItem>
    <StyledRowFlexItem>–</StyledRowFlexItem>
    <StyledRowFlexItem>–</StyledRowFlexItem>
  </StyledRowFlexParent>
)

const StyledRowFlexParent = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
`

// flex-grow, flex-shrink and flex-basis combined
const StyledRowFlexItem = styled.div`
  flex: 0 1 auto;
  margin-top: 15px;
`

const StyledLabel = styled.label`
  margin-bottom: 0;
  margin-top: 15px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.05rem;
  display: block;
`

AudienceSettingsRow.propTypes = {
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  handleToggle: PropTypes.func.isRequired,
}

export default AudienceSettingsRow
