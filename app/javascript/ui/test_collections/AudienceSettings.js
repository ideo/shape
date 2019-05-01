import React from 'react'
// import { PropTypes } from 'prop-types'
import styled from 'styled-components'
import AutosizeInput from 'react-input-autosize'
// import AudienceSettingsRow from '~/ui/global/AudienceSettingsRow'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import { SmallHelperText, DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

class AudienceSettings extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      options: [],
    }
  }

  componentDidMount() {
    this.setState({
      options: this.options,
    })
  }

  fetchOptions = () => {
    console.log('TODO: implement fetchOptions')
  }

  get options() {
    this.fetchOptions()
    // eventually this will be an API call to fetch audiences
    return [
      {
        id: 1,
        label: 'Share via link (on)',
        size: null,
        disabled: true,
        selected: true,
        hasInput: false,
      },
      {
        id: 2,
        label: 'All People (No Filters)',
        size: null,
        disabled: false,
        selected: false,
        hasInput: true,
      },
    ]
  }

  toggleCheckbox = e => {
    const { options } = this.state
    const parsedValue = parseInt(e.target.value)
    const foundOption = options.find(option => option.id === parsedValue)
    const updatedOption = Object.assign({}, foundOption, {
      selected: !foundOption.selected,
    })
    const newOptions = this.state.options.map(
      option => (option.id === parsedValue ? updatedOption : option)
    )
    this.setState({ options: newOptions })
  }

  stopEditingIfContent = () => {
    console.log('foo')
    // AJAX call to set size for audience in database
  }
  handleKeyPress = event => {
    if (event.key === 'Enter') this.stopEditingIfContent()
  }
  handleInputChange = e => {
    console.log(e.target)
    // let input component handle its own state and pass data back up?
  }

  render() {
    return (
      <AudienceSettingsWrapper>
        <h3>Audience</h3>
        <StyledRowFlexParent>
          <StyledRowFlexItem />
          <StyledRowFlexItem>
            <SmallHelperText>$/Response</SmallHelperText>
          </StyledRowFlexItem>
          <StyledRowFlexItem>
            <SmallHelperText>Size</SmallHelperText>
          </StyledRowFlexItem>
          <StyledRowFlexItem>
            <SmallHelperText>Price</SmallHelperText>
          </StyledRowFlexItem>
        </StyledRowFlexParent>
        {this.state.options.map(option => {
          const { label, id, selected, hasInput } = option
          return (
            <StyledRowFlexParent>
              <LabelContainer
                classes={{ label: 'form-control' }}
                labelPlacement={'end'}
                control={
                  <Checkbox
                    checked={selected}
                    onChange={this.toggleCheckbox}
                    value={id}
                    color={'default'}
                    iconStyle={{ fill: 'black' }}
                  />
                }
                label={
                  <div style={{ maxWidth: '582px' }}>
                    <StyledLabel>{label}</StyledLabel>
                  </div>
                }
              />
              <StyledRowFlexItem>
                <DisplayText color={v.colors.commonMedium}>–</DisplayText>
              </StyledRowFlexItem>
              <StyledRowFlexItem>
                {hasInput ? (
                  <EditableInput
                    id={option.id}
                    type="text"
                    placeholder="–"
                    value={option.size}
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleKeyPress}
                    onBlur={this.stopEditingIfContent}
                  />
                ) : (
                  <DisplayText color={v.colors.commonMedium}>–</DisplayText>
                )}
              </StyledRowFlexItem>
              <StyledRowFlexItem>
                <DisplayText color={v.colors.commonMedium}>–</DisplayText>
              </StyledRowFlexItem>
            </StyledRowFlexParent>
          )
        })}
      </AudienceSettingsWrapper>
    )
  }
}

const AudienceSettingsWrapper = styled.div`
  max-width: 750px;
`

const StyledRowFlexParent = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
`

// flex-grow, flex-shrink and flex-basis combined
const StyledRowFlexItem = styled.div`
  flex: 0 1 auto;
  margin-top: 15px;
`

const StyledLabel = styled.label`
  margin-bottom: 0;
  margin-top: 15px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.05rem;
  display: block;
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
    font-size: 16px;
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
