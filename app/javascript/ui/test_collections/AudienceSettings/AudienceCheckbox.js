import _ from 'lodash'
import PropTypes from 'prop-types'
import {
  StyledRowFlexParent,
  StyledRowFlexItem,
  StyledLabelText,
} from './styled'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'

const AudienceCheckbox = ({
  selected,
  audienceId,
  audienceName,
  onToggleCheckbox,
  disabled,
}) => (
  <StyledRowFlexParent>
    <StyledRowFlexItem>
      <LabelContainer
        classes={{ label: 'form-control' }}
        labelPlacement={'end'}
        control={
          <Checkbox
            data-cy={`audienceCheckbox-${_.kebabCase(audienceName)}`}
            id={`audienceCheckbox-${audienceId}`}
            checked={selected}
            onChange={onToggleCheckbox}
            value={audienceId}
            color={'default'}
            disabled={disabled}
          />
        }
        label={
          <div style={{ maxWidth: '582px', paddingTop: '15px' }}>
            <StyledLabelText>{audienceName}</StyledLabelText>
          </div>
        }
      />
    </StyledRowFlexItem>
  </StyledRowFlexParent>
)

AudienceCheckbox.propTypes = {
  selected: PropTypes.bool.isRequired,
  audienceId: PropTypes.string.isRequired,
  audienceName: PropTypes.string.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

AudienceCheckbox.defaultProps = {
  disabled: false,
}

export default AudienceCheckbox
