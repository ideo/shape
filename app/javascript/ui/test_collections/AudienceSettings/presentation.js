// import { PropTypes } from 'prop-types'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'
import { Checkbox, LabelContainer, FormButton } from '~/ui/global/styled/forms'
import { SmallHelperText, DisplayText } from '~/ui/global/styled/typography'
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
    <StyledRowFlexParent>
      <StyledRowFlexItem />
      <StyledRowFlexHeader>
        <SmallHelperText>$/Response</SmallHelperText>
      </StyledRowFlexHeader>
      <StyledRowFlexHeader>
        <SmallHelperText>Size</SmallHelperText>
      </StyledRowFlexHeader>
      <StyledRowFlexHeader>
        <SmallHelperText>Price</SmallHelperText>
      </StyledRowFlexHeader>
    </StyledRowFlexParent>
    {options.map(option => {
      const { label, id, selected, hasInput, pricePerResponse, size } = option
      return (
        <StyledRowFlexParent>
          <StyledRowFlexItem>
            <LabelContainer
              classes={{ label: 'form-control' }}
              labelPlacement={'end'}
              control={
                <Checkbox
                  checked={selected}
                  onChange={toggleCheckbox}
                  value={id}
                  color={'default'}
                  iconStyle={{ fill: 'black' }}
                />
              }
              label={
                <div style={{ maxWidth: '582px', paddingTop: '15px' }}>
                  <StyledLabel>{label}</StyledLabel>
                </div>
              }
            />
          </StyledRowFlexItem>
          <StyledRowFlexCell>
            <DisplayText color={v.colors.commonMedium}>
              {pricePerResponse ? pricePerResponse : '–'}
            </DisplayText>
          </StyledRowFlexCell>
          <StyledRowFlexCell>
            {hasInput ? (
              <EditableInput
                id={option.id}
                type="text"
                placeholder="–"
                value={option.size}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onBlur={stopEditingIfContent}
              />
            ) : (
              <DisplayText color={v.colors.commonMedium}>–</DisplayText>
            )}
          </StyledRowFlexCell>
          <StyledRowFlexCell>
            <DisplayText color={v.colors.commonMedium}>
              {size > 0 ? _.round(pricePerResponse * size, 2) : '–'}
            </DisplayText>
          </StyledRowFlexCell>
        </StyledRowFlexParent>
      )
    })}
    <StyledRowFlexParent>
      <StyledRowFlexItem />
      <StyledRowFlexCell />
      <StyledRowFlexCell>Total</StyledRowFlexCell>
      <StyledRowFlexCell>{totalPrice}</StyledRowFlexCell>
    </StyledRowFlexParent>
    <StyledRowFlexParent style={{ marginTop: '30px' }}>
      <StyledRowFlexItem />
      <StyledRowFlexCell />
      <FormButton>Get Feedback</FormButton>
    </StyledRowFlexParent>
  </AudienceSettingsWrapper>
)

const AudienceSettingsWrapper = styled.div`
  width: 100%;
  max-width: 500px;
`

const StyledRowFlexParent = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
`

// flex-grow, flex-shrink and flex-basis combined
const StyledRowFlexItem = styled.div`
  width: 250px;
`

const StyledRowFlexCell = styled(StyledRowFlexItem)`
  width: 70px;
  padding-top: 10px;
  text-align: center;
`

const StyledRowFlexHeader = styled(StyledRowFlexCell)`
  padding-top: 0px;
`

const StyledLabel = styled.label`
  margin-bottom: 0;
  margin-top: 15px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.05rem;
  display: inline;
  vertical-align: middle;
`

const EditableInput = styled(AutosizeInput)`
  width: 2rem;
  border-bottom: 1px solid ${v.colors.black};

  input {
    width: 2rem;
    background: transparent;
    border: 0;
    padding: 2px 3px;
    margin: -1px 0px -1px 0px;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    color: ${v.colors.black};
    &:focus {
      outline: 0;
    }
    &::placeholder {
      color: ${v.colors.commonDark};
    }
  }
`
EditableInput.displayName = 'EditableInput'

AudienceSettings.propTypes = {}

export default AudienceSettings
