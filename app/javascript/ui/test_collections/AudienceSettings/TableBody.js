import v from '~/utils/variables'
import styled from 'styled-components'
import { StyledRowFlexParent, StyledRowFlexCell } from './styled'
import { DisplayText } from '~/ui/global/styled/typography'
import AutosizeInput from 'react-input-autosize'

const TableBody = ({
  option,
  stopEditingIfContent,
  handleKeyPress,
  handleInputChange,
}) => (
  <StyledRowFlexParent>
    <StyledRowFlexCell>
      <DisplayText color={v.colors.commonMedium}>
        {option.pricePerResponse && option.selected
          ? `$${option.pricePerResponse}`
          : '–'}
      </DisplayText>
    </StyledRowFlexCell>
    <StyledRowFlexCell>
      {option.hasInput && option.selected ? (
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
        {option.size > 0 && option.selected
          ? `$${_.round(option.pricePerResponse * option.size, 2)}`
          : '–'}
      </DisplayText>
    </StyledRowFlexCell>
  </StyledRowFlexParent>
)

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
