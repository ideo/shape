import { PropTypes } from 'prop-types'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import styled from 'styled-components'
import v from '~/utils/variables'
// Should this just take an option instead of a label AND value?
const AudienceSettingsRow = ({ checked, label, value, handleToggle }) => {
  return (
    <LabelContainer
      classes={{ label: 'form-control' }}
      labelPlacement={'end'}
      control={
        <Checkbox checked={checked} onChange={handleToggle} value={value} />
      }
      label={
        <div style={{ maxWidth: '582px' }}>
          <StyledLabel>{label}</StyledLabel>
        </div>
      }
    />
  )
}

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
