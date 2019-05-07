import { observer } from 'mobx-react'
import AutosizeInput from 'react-input-autosize'

import v from '~/utils/variables'
import styled from 'styled-components'
import { StyledRowFlexParent, StyledRowFlexCell } from './styled'
import { DisplayText } from '~/ui/global/styled/typography'

@observer
class TableBody extends React.Component {
  handleInputChange = ev => {
    const { audience, onInputChange } = this.props

    onInputChange(audience.id, ev.target.value)
  }

  render() {
    const { audience, stopEditingIfContent, handleKeyPress } = this.props
    return (
      <StyledRowFlexParent>
        <StyledRowFlexCell>
          <DisplayText
            color={
              audience.currentlySelected
                ? v.colors.black
                : v.colors.commonMedium
            }
          >
            {audience.price_per_response && audience.currentlySelected
              ? `$${audience.price_per_response.toFixed(2)}`
              : '–'}
          </DisplayText>
        </StyledRowFlexCell>
        <StyledRowFlexCell>
          {audience.currentlySelected ? (
            <EditableInput
              id={audience.id}
              type="text"
              placeholder="–"
              value={audience.currentSampleSize}
              onChange={this.handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={stopEditingIfContent}
            />
          ) : (
            <DisplayText color={v.colors.commonMedium}>–</DisplayText>
          )}
        </StyledRowFlexCell>
        <StyledRowFlexCell>
          <DisplayText
            color={
              audience.currentlySelected
                ? v.colors.black
                : v.colors.commonMedium
            }
          >
            {audience.currentSampleSize > 0 && audience.currentlySelected
              ? `$${_.round(
                  audience.price_per_response * audience.currentSampleSize,
                  2
                ).toFixed(2)}`
              : '–'}
          </DisplayText>
        </StyledRowFlexCell>
      </StyledRowFlexParent>
    )
  }
}

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

export default TableBody
