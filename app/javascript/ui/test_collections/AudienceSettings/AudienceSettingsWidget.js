import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { FormButton } from '~/ui/global/styled/forms'
import {
  StyledRowFlexItem,
  StyledRowFlexCell,
  StyledRowFlexParent,
  StyledColumnFlexParent,
} from './styled'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import AudienceLabel from './AudienceLabel'
import v from '~/utils/variables'

@observer
class AudienceSettings extends React.Component {
  renderTableBody(audience) {
    const { stopEditingIfContent, handleKeyPress, onInputChange } = this.props
    return (
      <TableBody
        audience={audience}
        stopEditingIfContent={stopEditingIfContent}
        handleKeyPress={handleKeyPress}
        onInputChange={onInputChange}
      />
    )
  }

  renderLabel(audience) {
    const { onToggleCheckbox } = this.props
    return (
      <AudienceLabel
        audienceId={audience.id}
        audienceName={audience.name}
        selected={audience.currentlySelected}
        onToggleCheckbox={onToggleCheckbox}
      />
    )
  }

  render() {
    const { audiences, onSubmitSettings, totalPrice } = this.props
    return (
      <AudienceSettingsWrapper>
        <h3 style={{ marginBottom: '0px' }}>Audience</h3>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <MobileWrapper>
            <StyledColumnFlexParent>
              {audiences.map(audience => {
                return (
                  <StyledColumnFlexParent key={audience.id}>
                    {this.renderLabel(audience)}
                    <TableHeader />
                    {this.renderTableBody(audience)}
                  </StyledColumnFlexParent>
                )
              })}
              <StyledRowFlexParent style={{ marginTop: '15px' }}>
                <StyledRowFlexCell />
                <StyledRowFlexCell>Total</StyledRowFlexCell>
                <StyledRowFlexCell>{totalPrice}</StyledRowFlexCell>
              </StyledRowFlexParent>
              <StyledRowFlexParent
                style={{
                  marginTop: '30px',
                  marginBottom: '30px',
                  justifyContent: 'center',
                }}
              >
                <FormButton onClick={onSubmitSettings}>Get Feedback</FormButton>
              </StyledRowFlexParent>
            </StyledColumnFlexParent>
          </MobileWrapper>

          <DesktopWrapper>
            <StyledRowFlexParent>
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <TableHeader />
              </StyledRowFlexParent>
              {audiences.map(audience => {
                return (
                  <StyledRowFlexParent key={audience.id}>
                    {this.renderLabel(audience)}
                    {this.renderTableBody(audience)}
                  </StyledRowFlexParent>
                )
              })}
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <StyledRowFlexCell />
                <StyledRowFlexCell>Total</StyledRowFlexCell>
                <StyledRowFlexCell>{totalPrice}</StyledRowFlexCell>
              </StyledRowFlexParent>
              <StyledRowFlexParent
                style={{ marginTop: '24px', marginBottom: '32px' }}
              >
                <StyledRowFlexItem />
                <FormButton
                  style={{ marginLeft: '40px' }}
                  onClick={onSubmitSettings}
                >
                  Get Feedback
                </FormButton>
              </StyledRowFlexParent>
            </StyledRowFlexParent>
          </DesktopWrapper>

          <StyledColumnFlexParent />
        </div>
      </AudienceSettingsWrapper>
    )
  }
}
AudienceSettings.propTypes = {
  audiences: MobxPropTypes.objectOrObservableObject.isRequired,
  onSubmitSettings: PropTypes.func.isRequired,
  handleKeyPress: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  totalPrice: PropTypes.number.isRequired,
}

const AudienceSettingsWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    max-width: 350px;
  }
`

const DesktopWrapper = styled.div`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

const MobileWrapper = styled.div`
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

AudienceSettings.propTypes = {}

export default AudienceSettings
