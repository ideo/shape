import { StyledRowFlexParent, StyledRowFlexItem, StyledLabel } from './styled'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'

const AudienceLabel = ({
  selected,
  audienceId,
  audienceName,
  onToggleCheckbox,
}) => (
  <StyledRowFlexParent>
    <StyledRowFlexItem>
      <LabelContainer
        classes={{ label: 'form-control' }}
        labelPlacement={'end'}
        control={
          <Checkbox
            id={`audienceCheckbox-${audienceId}`}
            checked={selected}
            onChange={onToggleCheckbox}
            value={audienceId}
            color={'default'}
          />
        }
        label={
          <div style={{ maxWidth: '582px', paddingTop: '15px' }}>
            <StyledLabel htmlFor={`audienceCheckbox-${audienceId}`}>
              {audienceName}
            </StyledLabel>
          </div>
        }
      />
    </StyledRowFlexItem>
  </StyledRowFlexParent>
)

export default AudienceLabel
