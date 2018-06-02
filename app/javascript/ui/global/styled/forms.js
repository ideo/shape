import Chip from 'material-ui/Chip'
import MuiSelect from 'material-ui/Select'
import { MenuItem } from 'material-ui/Menu'
import AutosizeInput from 'react-input-autosize'
import TextareaAutosize from 'react-autosize-textarea'
import styled from 'styled-components'
import v from '~/utils/variables'

/** @component */
export const FormActionsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding-bottom: 14px;
  text-align: center;
`
FormActionsContainer.displayName = 'StyledFormActionsContainer'

/** @component */
export const FieldContainer = styled.div`
  padding-bottom: 35px;

  label {
    margin-right: 15px;
  }
`
FieldContainer.displayName = 'StyledFieldContainer'

/** @component */
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

/** @component */
export const FormButton = styled.button`
  width: ${props => (props.width ? props.width : 183)}px;
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
  &:hover, &:focus {
    background-color: ${v.colors.cloudy};
  }
  ${props => props.disabled &&
      `background-color: white;
      border: 1px solid ${v.colors.gray};
      color:  ${v.colors.gray};
      cursor: initial;
      &:hover, &:focus {
        background-color: white;
      }
    `};
`
FormButton.displayName = 'StyledFormButton'

/** @component */
export const TextButton = styled.button`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  cursor: pointer;
  max-width: ${props => (props.maxWidth ? `${props.maxWidth}px` : 'none')};
`
TextButton.displayName = 'StyledTextButton'

/** @component */
export const TextField = styled.input`
  font-family: ${v.fonts.sans};
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
  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen
    and (min-width: ${v.responsive.medBreakpoint}px)
    and (max-width: ${v.responsive.largeBreakpoint}px) {
    width: 185px;
  }
`
TextField.displayName = 'StyledTextField'

/** @component */
export const FormSpacer = styled.div`
  margin-bottom: 55px;
`
FormSpacer.displayName = 'StyledFormSpacer'

/** @component */
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
/** @component */
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

/** @component */
export const Select = styled(MuiSelect)`
  .select {
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    font-weight: ${v.weights.book};
  }

  .selectMenu: {
    background-color: transparent;
    &:focus { background-color: transparent; }
    &:hover { background-color: transparent; }

    li {
      font-family: ${v.fonts.sans};
      font-size: 1rem;
      font-weight: ${v.weights.book};
    }
  }
`
Select.displayName = 'StyledSelect'

/** @component */
export const SelectOption = styled(MenuItem)`
  &.selectOption {
    align-items: center;
    display: flex;
    height: 38px;
    margin-bottom: 4px;
    margin-top: 4px;
    padding: 0 4px;

    &:hover: {
      opacity: 1.0
    }
  }

`
SelectOption.displayName = 'StyledSelectOption'

/** @component */
export const StyledAutosizeInput = styled(AutosizeInput)`
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  input {
    position: relative;
    font-size: ${props => props.fontSize}rem;
    font-family: ${v.fonts.sans};
    font-weight: ${v.weights.medium};
    letter-spacing: 0.125rem;
    padding: 0.15rem 0 0.5rem 0;
    background-color: transparent;
    border-left: none;
    border-top: none;
    border-right: none;
    border-bottom: 1px solid ${v.colors.blackLava};
    &:focus {
      outline: 0;
    }
  }
`
StyledAutosizeInput.displayName = 'StyledAutosizeInput'

/** @component */
export const EditAvatarButton = styled.button`
  cursor: auto;
  ${props => props.canEdit &&
    `
    cursor: pointer;
    opacity: 0.75;
    `
}`
EditAvatarButton.displayName = 'EditAvatarButton'

/** @component */
export const CommentForm = styled.form`
  min-height: 50px;
  position: relative;

  button {
    position: absolute;
    right: 18px;
    top: 14px;
    width: 18px;
    height: 18px;
  }
`
CommentForm.displayName = 'CommentForm'

export const StyledCommentTextarea = styled.div`
  textarea {
    resize: none;
    padding: 10px;
    font-size: 1rem;
    font-family: ${v.fonts.serif};
    border: none;
    background: none;

    :focus {
      border: none;
      outline: none;
    }
    ::placeholder {
      color: ${v.colors.gray};
    }
    /* TODO: cross-browser friendly way to hide scrollbar?
      note this is only for a really long comment (>6 rows) */
    ::-webkit-scrollbar {
      background: none;
    }
  }
`

/** @component */
export const CommentTextarea = props => (
  <StyledCommentTextarea>
    <TextareaAutosize {...props} />
  </StyledCommentTextarea>
)
