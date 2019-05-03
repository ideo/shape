import { StyledRowFlexParent, StyledRowFlexItem, StyledLabel } from './styled'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'

const AudienceLabel = ({ option, toggleCheckbox }) => (
  <StyledRowFlexParent>
    <StyledRowFlexItem>
      <LabelContainer
        classes={{ label: 'form-control' }}
        labelPlacement={'end'}
        control={
          <Checkbox
            checked={option.selected}
            onChange={toggleCheckbox}
            value={option.id}
            color={'default'}
            iconStyle={{ fill: 'black' }}
          />
        }
        label={
          <div style={{ maxWidth: '582px', paddingTop: '15px' }}>
            <StyledLabel>{option.label}</StyledLabel>
          </div>
        }
      />
    </StyledRowFlexItem>
  </StyledRowFlexParent>
)

export default AudienceLabel
