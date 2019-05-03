// import { PropTypes } from 'prop-types'
import styled from 'styled-components'
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

const AudienceSettings = ({
  options,
  toggleCheckbox,
  stopEditingIfContent,
  handleKeyPress,
  handleInputChange,
  totalPrice,
}) => (
  <AudienceSettingsWrapper>
    <h3 style={{ marginBottom: '0px' }}>Audience</h3>
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <MobileWrapper>
        <StyledColumnFlexParent>
          {options.map(option => {
            return (
              <StyledColumnFlexParent>
                <AudienceLabel
                  option={option}
                  toggleCheckbox={toggleCheckbox}
                />
                <TableHeader />

                <TableBody
                  option={option}
                  stopEditingIfContent={stopEditingIfContent}
                  handleKeyPress={handleKeyPress}
                  handleInputChange={handleInputChange}
                />
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
              <StyledRowFlexParent>
                <AudienceLabel
                  option={option}
                  toggleCheckbox={toggleCheckbox}
                />

                <TableBody
                  option={option}
                  stopEditingIfContent={stopEditingIfContent}
                  handleKeyPress={handleKeyPress}
                  handleInputChange={handleInputChange}
                />
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
            <FormButton style={{ marginLeft: '40px' }}>Get Feedback</FormButton>
          </StyledRowFlexParent>
        </StyledRowFlexParent>
      </DesktopWrapper>

      <StyledColumnFlexParent />
    </div>
  </AudienceSettingsWrapper>
)

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
