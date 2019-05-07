// import { PropTypes } from 'prop-types'
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
  renderTableBody(option) {
    const { stopEditingIfContent, handleKeyPress, onInputChange } = this.props
    return (
      <TableBody
        option={option}
        stopEditingIfContent={stopEditingIfContent}
        handleKeyPress={handleKeyPress}
        onInputChange={onInputChange}
      />
    )
  }

  renderLabel(option) {
    const { onToggleCheckbox } = this.props
    return (
      <AudienceLabel
        audienceId={option.id}
        audienceName={option.name}
        selected={option.currentlySelected}
        onToggleCheckbox={onToggleCheckbox}
      />
    )
  }

  render() {
    const { options, totalPrice } = this.props
    return (
      <AudienceSettingsWrapper>
        <h3 style={{ marginBottom: '0px' }}>Audience</h3>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <MobileWrapper>
            <StyledColumnFlexParent>
              {options.map(option => {
                return (
                  <StyledColumnFlexParent key={option.id}>
                    {this.renderLabel(option)}
                    <TableHeader />
                    {this.renderTableBody(option)}
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
                <FormButton>Get Feedback</FormButton>
              </StyledRowFlexParent>
            </StyledColumnFlexParent>
          </MobileWrapper>

          <DesktopWrapper>
            <StyledRowFlexParent>
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <TableHeader />
              </StyledRowFlexParent>
              {options.map(option => {
                return (
                  <StyledRowFlexParent key={option.id}>
                    {this.renderLabel(option)}
                    {this.renderTableBody(option)}
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
                style={{
                  marginTop: '24px',
                  marginBottom: '32px',
                }}
              >
                <StyledRowFlexItem />
                <FormButton style={{ marginLeft: '40px' }}>
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
  options: MobxPropTypes.objectOrObservableObject.isRequired,
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
