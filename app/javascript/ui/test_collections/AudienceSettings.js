import React from 'react'
// import { PropTypes } from 'prop-types'
import styled from 'styled-components'
// import AudienceSettingsRow from '~/ui/global/AudienceSettingsRow'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import v, { colors } from '~/utils/variables'

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
        disabled: true,
        selected: true,
        hasInput: false,
      },
      {
        id: 2,
        label: 'All People (No Filters)',
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

  render() {
    return (
      <AudienceSettingsWrapper>
        <h3>Audience</h3>
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
              <StyledRowFlexItem>–</StyledRowFlexItem>
              <StyledRowFlexItem>
                {hasInput ? <StyledInput /> : '–'}
              </StyledRowFlexItem>
              <StyledRowFlexItem>–</StyledRowFlexItem>
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

const StyledInput = styled.input`
  background: ${v.colors.primaryLightest};
`

AudienceSettings.propTypes = {}

export default AudienceSettings
