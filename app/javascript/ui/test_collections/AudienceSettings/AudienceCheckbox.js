import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import {
  StyledRowFlexParent,
  StyledRowFlexItem,
  StyledLabelText,
} from './styled'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import InfoIcon from '~/ui/icons/InfoIcon'
import styled from 'styled-components'

const StyledInfoIconWrapper = styled.span`
  width: 8%;
  opacity: 0.5;
  transform: translateY(1px);
  &:hover {
    opacity: 1;
  }
  float: right;
`

const AudienceCheckbox = ({
  selected,
  audience,
  onToggleCheckbox,
  disabled,
  openAudienceMenu,
}) => {
  const { id, name, global_default } = audience
  return (
    <StyledRowFlexParent>
      <StyledRowFlexItem>
        <LabelContainer
          classes={{ label: 'form-control' }}
          labelPlacement={'end'}
          control={
            <Checkbox
              data-cy={`audienceCheckbox-${_.kebabCase(name)}`}
              id={`audienceCheckbox-${id}`}
              checked={selected}
              onChange={onToggleCheckbox}
              value={id}
              color={'default'}
              disabled={disabled}
            />
          }
          label={
            <div>
              <div style={{ maxWidth: '582px', paddingTop: '15px' }}>
                <StyledLabelText>
                  {name}
                  {!global_default && (
                    <StyledInfoIconWrapper
                      onClick={e => {
                        e.preventDefault()
                        openAudienceMenu(audience)
                      }}
                      className="audienceLabel"
                    >
                      <InfoIcon />
                    </StyledInfoIconWrapper>
                  )}
                </StyledLabelText>
              </div>
            </div>
          }
        />
      </StyledRowFlexItem>
    </StyledRowFlexParent>
  )
}

AudienceCheckbox.propTypes = {
  selected: PropTypes.bool.isRequired,
  audience: MobxPropTypes.objectOrObservableObject.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  openAudienceMenu: PropTypes.func.isRequired,
}

AudienceCheckbox.defaultProps = {
  disabled: false,
}

export default AudienceCheckbox
