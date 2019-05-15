import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { FormButton } from '~/ui/global/styled/forms'
import { DisplayTextCss } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import {
  StyledRowFlexItem,
  StyledRowFlexCell,
  StyledRowFlexParent,
  StyledColumnFlexParent,
} from './styled'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import AudienceCheckbox from './AudienceCheckbox'

const AudienceSettingsWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    max-width: 350px;
  }
  ${DisplayTextCss};
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

@observer
class AudienceSettingsWidget extends React.Component {
  audienceSelected(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings[audience.id]
    return option ? option.selected : false
  }

  sampleSize(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings[audience.id]
    return option ? option.sample_size : ''
  }

  renderTableBody(audience) {
    const { handleKeyPress, onInputChange } = this.props
    return (
      <TableBody
        audience={audience}
        handleKeyPress={handleKeyPress}
        onInputChange={onInputChange}
        selected={this.audienceSelected(audience)}
        sampleSize={this.sampleSize(audience)}
      />
    )
  }

  renderCheckbox(audience) {
    const { onToggleCheckbox } = this.props
    return (
      <AudienceCheckbox
        audienceId={audience.id}
        audienceName={audience.name}
        selected={this.audienceSelected(audience)}
        onToggleCheckbox={onToggleCheckbox}
      />
    )
  }

  render() {
    const { audiences, onSubmitSettings, totalPrice } = this.props

    const totalPriceDisplay = (
      <React.Fragment>
        <StyledRowFlexCell>Total</StyledRowFlexCell>
        <StyledRowFlexCell>
          <strong>${totalPrice}</strong>
        </StyledRowFlexCell>
      </React.Fragment>
    )
    return (
      <AudienceSettingsWrapper>
        <h3 style={{ marginBottom: '0px' }}>Audience</h3>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <MobileWrapper>
            <StyledColumnFlexParent>
              {audiences.map(audience => {
                return (
                  <StyledColumnFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    <TableHeader />
                    {this.renderTableBody(audience)}
                  </StyledColumnFlexParent>
                )
              })}
              <StyledRowFlexParent style={{ marginTop: '15px' }}>
                <StyledRowFlexCell />
                {totalPriceDisplay}
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
                    {this.renderCheckbox(audience)}
                    {this.renderTableBody(audience)}
                  </StyledRowFlexParent>
                )
              })}
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <StyledRowFlexCell />
                {totalPriceDisplay}
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

AudienceSettingsWidget.propTypes = {
  audiences: MobxPropTypes.arrayOrObservableArray.isRequired,
  audienceSettings: MobxPropTypes.objectOrObservableObject.isRequired,
  onSubmitSettings: PropTypes.func.isRequired,
  handleKeyPress: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  totalPrice: PropTypes.string.isRequired,
}

export default AudienceSettingsWidget
