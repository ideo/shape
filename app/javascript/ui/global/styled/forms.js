import Chip from 'material-ui/Chip'
import { MenuItem } from 'material-ui/Menu'
import styled from 'styled-components'
import v from '~/utils/variables'

export const FormActionsContainer = styled.div`
  padding-bottom: 14px;
  text-align: center;
`
FormActionsContainer.displayName = 'StyledFormActionsContainer'

export const FieldContainer = styled.div`
  padding-bottom: 35px;

  label {
    margin-right: 15px;
  }
`
FieldContainer.displayName = 'StyledFieldContainer'

export const Label = styled.label`
  text-transform: uppercase;
  margin-bottom: 20px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
  display: block;
`
Label.displayName = 'StyledLabel'

export const FormButton = styled.button`
  width: 183px;
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  height: 40px;
  cursor: pointer;
  color: white;
  border-radius: 20px;
  border: none;
  background-color: ${v.colors.blackLava};
`
FormButton.displayName = 'StyledFormButton'

export const TextButton = styled.button`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  cursor: pointer;
`
TextButton.displayName = 'StyledTextButton'

export const TextField = styled.input`
  width: 225px;
  padding-right: 4px;
  padding-left: 4px;
  padding-bottom: 6px;
  outline-width: 0;
  font-size: 1rem;
  border: 0;
  border-bottom: 0.5px solid ${v.colors.gray};

  &::placeholder {
    color: ${v.colors.gray};
  }

  &:focus {
    outline-width: 0;
  }
`
TextField.displayName = 'StyledTextField'

export const FormSpacer = styled.div`
  margin-bottom: 55px;
`
FormSpacer.displayName = 'StyledFormSpacer'

export const ImageField = styled.span`
  width: 100px;
  position: relative;
  height: 100px;
  display: block;
  color: white;
  border-radius: 50%;
  background-color: ${v.colors.gray};

  span {
    position: absolute;
    font-size: 36px;
    font-weight: ${v.weights.book};
    left: calc(50% - 8px);
    top: calc(50% - 23px);
  }
`
ImageField.displayName = 'StyledImageField'

// TODO research if we can get these styles working without extra className
export const Pill = styled(Chip)`
  &.pill {
    padding: 7px;
    margin: 5px;
    font-weight: ${v.weights.medium};
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    justify-content: flex-start;
    background-color: ${v.colors.desert};
    border-radius: 0;
  }

  &.avatar {
    height: 38px;
    width: 38px;
  }
`
Pill.displayName = 'StyledPill'

export const SelectOption = styled(MenuItem)`
  .selectOption {
    alignItems: center;
    height: 38px;
    margin-bottom: 7px;
    opacity: 0.5;
    padding: 0 4px;
  }

  &:hover: {
    opacity: 1.0
  }
`
SelectOption.displayName = 'StyledSelectOption'
