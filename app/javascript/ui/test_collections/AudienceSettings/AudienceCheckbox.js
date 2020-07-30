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
import v from '~/utils/variables'

const StyledInfoIconWrapper = styled.span`
  opacity: 0.5;
  margin-top: 1rem;

  &:hover {
    opacity: 1;
  }

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    opacity: 1; // Make full opacity because there's no hover on mobile
  }

  span {
    width: 1rem;
    height: 1rem;
  }
`

const AssignReviewersLink = styled.h3`
  display: inline-block;
  color: #00a6ff;
  font-size: 12px;
`

const AudienceCheckbox = ({
  selected,
  audience,
  audienceName,
  onToggleCheckbox,
  disabled,
  openAudienceMenu,
  displayChallengeAudiences,
  handleAssignReviewers,
}) => {
  const { id, global_default } = audience
  return (
    <StyledRowFlexParent>
      <StyledRowFlexItem>
        <LabelContainer
          classes={{ label: 'form-control' }}
          labelPlacement={'end'}
          control={
            <Checkbox
              data-cy={`audienceCheckbox-${_.kebabCase(audienceName)}`}
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
                <StyledLabelText>{audienceName}</StyledLabelText>
                {displayChallengeAudiences &&
                  audienceName.includes('Reviewers') &&
                  !disabled && (
                    <AssignReviewersLink
                      onClick={e => {
                        e.preventDefault()
                        if (handleAssignReviewers) {
                          handleAssignReviewers()
                        }
                      }}
                    >
                      ASSIGN REVIEWERS
                    </AssignReviewersLink>
                  )}
              </div>
            </div>
          }
        />
      </StyledRowFlexItem>
      {!global_default && (
        <StyledInfoIconWrapper
          onClick={e => {
            e.preventDefault()
            openAudienceMenu(audience)
          }}
          className="audienceLabel"
        >
          {!displayChallengeAudiences && <InfoIcon />}
        </StyledInfoIconWrapper>
      )}
    </StyledRowFlexParent>
  )
}

AudienceCheckbox.propTypes = {
  selected: PropTypes.bool.isRequired,
  audience: MobxPropTypes.objectOrObservableObject.isRequired,
  audienceName: PropTypes.string.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  openAudienceMenu: PropTypes.func.isRequired,
  displayChallengeAudiences: PropTypes.bool,
  handleAssignReviewers: PropTypes.func,
}

AudienceCheckbox.defaultProps = {
  disabled: false,
  displayChallengeAudiences: false,
  handleAssignReviewers: null,
}

export default AudienceCheckbox
