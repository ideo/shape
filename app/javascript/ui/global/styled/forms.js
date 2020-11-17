import FormControlLabel from '@material-ui/core/FormControlLabel'
import MuiSelect from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import MuiCheckbox from '@material-ui/core/Checkbox'
import MuiRadio from '@material-ui/core/Radio'
import AutosizeInput from 'react-input-autosize'
import TextareaAutosize from 'react-autosize-textarea'
import styled, { css } from 'styled-components'

import { hexToRgba } from '~/utils/colorUtils'
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

const LabelStyle = css`
  text-transform: uppercase;
  margin-bottom: 20px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
  display: block;
`

export const LabelText = styled.div`
  ${LabelStyle};
`
LabelText.displayName = 'StyledLabelText'

export const LabelHint = styled.span`
  color: ${v.colors.commonDark};
  font-size: 1rem;
`

export const LabelTextStandalone = styled.div`
  ${LabelStyle};
  font-weight: normal;
  text-transform: none;
  margin: 12px 0 4px 0;
`

export const LabelContainer = styled(FormControlLabel)`
  && {
    align-items: flex-start;
  }
`

/** @component */
export const Label = styled.label`
  ${LabelStyle};
`
Label.displayName = 'StyledLabel'

export const ShowMoreButton = styled.button`
  width: 100%;
  text-align: center;
  font-family: ${v.fonts.sans};
  font-size: 0.875rem;
  color: ${props =>
    props.darkBg ? v.colors.commonLight : v.colors.commonDark};
  &:hover {
    color: ${props => (props.darkBg ? v.colors.commonMedium : v.colors.black)};
  }
`
ShowMoreButton.defaultProps = {
  darkBg: false,
}
ShowMoreButton.displayName = 'ShowMoreButton'

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
  border-bottom: 0.5px solid ${v.colors.commonMedium};

  &::placeholder {
    color: ${v.colors.commonMedium};
  }

  &:focus {
    outline-width: 0;
  }
`
TextField.displayName = 'StyledTextField'

/** @component */
export const BctTextField = styled(TextField)`
  background: ${v.colors.commonLight};
  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    width: 185px;
  }
`
BctTextField.displayName = 'BctTextField'

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
  background-color: ${v.colors.commonMedium};

  span {
    position: absolute;
    font-size: 36px;
    font-weight: ${v.weights.book};
    left: calc(50% - 8px);
    top: calc(50% - 23px);
  }
`
ImageField.displayName = 'StyledImageField'

export const RoundPill = styled.div`
  background-color: ${v.colors.commonLight};
  border-radius: 15px;
  color: ${v.colors.commonDark};
  display: inline-block;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  margin-bottom: 8px;
  padding: 5px 10px;
  width: auto;

  strong {
    font-weight: ${v.weights.medium};
  }
`

/** @component */
export const Select = styled(MuiSelect)`
  ${props => props.inline && 'display: inline-block;'}
  font-family: ${v.fonts.sans};
  border-radius: 0;
  font-size: ${props => (props.inline ? 'inherit !important' : '1rem')};
  font-weight: ${props =>
    props.inline ? 'inherit !important' : v.weights.book};
  letter-spacing: ${props => (props.inline ? 'inherit !important' : '1px')};
  padding-bottom: 0;
  padding-top: 0;

  ${props =>
    props.inline &&
    `
  margin-bottom: -9px;
  margin-top: -6px;
  `} .grayedOut {
    color: ${v.colors.commonMedium};
  }

  .fullWidth {
    min-width: calc(100% - 30px);
  }

  .fixedWidth {
    width: 230px;
  }

  .selectMenu {
    background-color: transparent;
    border-radius: 0;
    padding-bottom: 0;
    padding-top: 0;
    vertical-align: baseline;
    color: ${props => props.theme.fontColor || 'inherit'};

    &.bottomPadded {
      padding-bottom: 7px;
    }
    &:focus {
      background-color: transparent;
    }
    &:hover {
      background-color: transparent;
    }
    li {
      font-family: ${v.fonts.sans};
      font-size: ${props => (props.inline ? 'inherit' : '1rem')};
      font-weight: ${v.weights.book};
    }
  }
`
Select.displayName = 'StyledSelect'

/** @component */
export const Checkbox = styled(MuiCheckbox)`
  &.remove-padding {
    height: auto;
    margin-right: 0;
    vertical-align: middle;
    width: 28px;
  }

  &.checkbox--error {
    color: ${v.colors.alert};
  }
  &.checkbox--black {
    color: ${v.colors.black} !important;
  }
  &.checkbox--white,
  &.checkbox--checked-white {
    color: white !important;
  }
`
Checkbox.displayName = 'StyledCheckbox'

export const Radio = styled(MuiRadio)`
  &.remove-padding {
    height: auto;
    vertical-align: middle;
    width: 28px;
  }

  &.radio--error {
    color: ${v.colors.alert};
  }
  &.radio--black {
    color: ${v.colors.black} !important;
  }
  &.radio--disabled {
    color: ${v.colors.commonLight} !important;
  }
  &.radio--white,
  &.radio--checked-white {
    color: white !important;
  }
`
Radio.displayName = 'StyledRadio'

/** @component */
export const SelectOption = styled(MenuItem)`
  &.selectOption {
    display: block;
    height: auto;
    padding: 12px 10px 12px 20px;
    position: relative;
    border-top: 1px solid ${v.colors.commonMedium};

    &::before {
      background-color: transparent;
      content: '';
      display: block;
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 8px;

      &:hover {
        background-color: ${v.colors.black};
      }
    }

    &:hover {
      background-color: inherit !important;
      &::before {
        background-color: ${v.colors.black} !important;
      }
    }
  }

  &.wide {
    width: 200px;
  }

  &.selected {
    background-color: inherit !important;
    border-left-color: ${v.colors.black};
  }

  &.category {
    text-transform: uppercase;
    font-size: 0.8125rem;
    font-weight: ${v.weights.medium};
    letter-spacing: 0.0625rem;
    color: ${v.colors.black};
    border-top: 1px solid ${v.colors.black};
    opacity: 1;
  }

  &.grayedOut {
    color: ${v.colors.commonMedium};
  }
`
SelectOption.displayName = 'StyledSelectOption'

export const CheckboxSelectOption = styled(MenuItem)`
  &.selectOption {
    display: block;
    height: auto;
    padding: 0 10px 0 0;
    border-top: 1px solid ${v.colors.commonMedium};
  }
`
CheckboxSelectOption.displayName = 'StyledCheckboxSelectOption'

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
    border-bottom: 1px solid ${v.colors.black};
    &:focus {
      outline: 0;
    }
  }
`
StyledAutosizeInput.displayName = 'StyledAutosizeInput'

/** @component */
export const EditAvatarButton = styled.button`
  cursor: auto;
  display: block;
  margin-left: 5px;
  ${props =>
    props.canEdit &&
    `
    cursor: pointer;
    opacity: 0.75;

    .avatar {
      cursor: pointer;
    }
    `};
`
EditAvatarButton.displayName = 'EditAvatarButton'

/** @component */
export const CommentForm = styled.form`
  min-height: 50px;
  position: relative;
  /* NOTE: 'sticky' is not fully browser supported */
  z-index: ${v.zIndex.commentMentions};
  position: sticky;
  bottom: 0;
  width: 100%;
  border-top: 4px solid ${v.colors.secondaryDark};
  background: ${v.colors.secondaryDark};
  background: linear-gradient(
    ${hexToRgba(v.colors.secondaryDark, 0)} 0,
    ${v.colors.secondaryDark} 10%,
    ${v.colors.secondaryDark} 100%
  );
`
CommentForm.displayName = 'CommentForm'

export const StyledCommentTextarea = styled.div`
  input,
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
      color: ${v.colors.commonMedium};
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

export const CommentEnterButton = styled.button`
  position: absolute;
  right: 10px;
  top: 7px;
  width: 30px;
  height: 30px;
  background-color: ${v.colors.secondaryDark};
  border-radius: 50%;
  padding: 6px;

  svg {
    transform: scale(1, -1);
  }

  &:hover {
    filter: brightness(90%);
  }

  ${props =>
    !props.focused &&
    `
    background: transparent;
    border: 1px solid ${v.colors.commonMedium};
    color: ${v.colors.commonMedium};

    &:hover {
      background: transparent;
      border: 1px solid ${v.colors.commonMedium};
      color: ${v.colors.commonMedium};
    }
  `};
`
