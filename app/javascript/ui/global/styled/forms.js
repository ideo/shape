import Chip from '@material-ui/core/Chip'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import MuiSelect from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import MuiCheckbox from '@material-ui/core/Checkbox'
import AutosizeInput from 'react-input-autosize'
import TextareaAutosize from 'react-autosize-textarea'
import styled, { css } from 'styled-components'

import hexToRgba from '~/utils/hexToRgba'
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

export const LabelTextStandalone = styled.div`
  ${LabelStyle};
  margin-bottom: 0;
  margin-top: 12px;
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

/** @component */
export const FormButton = styled.button`
  width: ${props => (props.width ? props.width : 183)}px;
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.09375rem;
  height: 40px;
  cursor: pointer;
  border-radius: 20px;
  color: ${props => {
    switch (props.color) {
      case v.colors.transparent:
        return v.colors.black
      default:
        return 'white'
    }
  }};
  background-color: ${props => props.color};
  border: ${props =>
    props.color === v.colors.transparent
      ? `1px solid ${v.colors.black}`
      : 'none'};
  transition: all 0.3s;
  &:hover,
  &:focus {
    background-color: ${props =>
      props.color === v.colors.primaryDark
        ? v.colors.primaryDarkest
        : v.colors.commonDark};
  }
  ${props =>
    props.disabled &&
    `background-color: white;
      border: 1px solid ${v.colors.commonMedium};
      color:  ${v.colors.commonMedium};
      cursor: initial;
      &:hover, &:focus {
        background-color: white;
      }
    `};
`
FormButton.displayName = 'StyledFormButton'
FormButton.defaultProps = {
  color: v.colors.black,
}

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
  border-bottom: 0.5px solid ${v.colors.commonMedium};

  &::placeholder {
    color: ${v.colors.commonMedium};
  }

  &:focus {
    outline-width: 0;
  }
  /* handle "small 4-col" layout i.e. layoutSize == 3 */
  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    width: 185px;
  }
`
TextField.displayName = 'StyledTextField'

/** @component */
export const BctTextField = TextField.extend`
  background: ${v.colors.commonLight};
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
    background-color: ${v.colors.commonLightest};
    border-radius: 0;
  }

  &.avatar {
    height: 38px;
    width: 38px;
  }
`
Pill.displayName = 'StyledPill'

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
    &:focus {
      background-color: transparent;
    }
    &:hover {
      background-color: transparent;
    }
    ${props => props.onDefault && `color: ${v.colors.commonMedium};`} li {
      font-family: ${v.fonts.sans};
      font-size: ${props => (props.inline ? 'inherit' : '1rem')};
      font-weight: ${v.weights.book};
    }
  }
`
Select.displayName = 'StyledSelect'

/** @component */
export const Checkbox = styled(MuiCheckbox)`
  &.checkbox--error {
    color: ${v.colors.alert};
  }
  &.checkbox--white,
  &.checkbox--checked-white {
    color: white !important;
  }
`
Checkbox.displayName = 'StyledCheckbox'

/** @component */
export const SelectOption = styled(MenuItem)`
  &.selectOption {
    display: block;
    height: auto;
    padding: 12px 10px 12px 20px;
    position: relative;

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

    &::after {
      background-color: ${v.colors.commonMedium};
      bottom: 0;
      content: '';
      display: block;
      height: 1px;
      left: 0;
      position: absolute;
      width: 100%;
    }

    &:hover {
      background-color: inherit !important;
      &::before {
        background-color: ${v.colors.black} !important;
      }
    }
  }

  &.selected {
    background-color: inherit !important;
    border-left-color: ${v.colors.black};
  }

  &.grayedOut {
    color: ${v.colors.commonMedium};
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
  button {
    position: absolute;
    right: 18px;
    top: 14px;
    width: 18px;
    height: 18px;
  }
  .textarea-input {
    background: ${v.colors.secondaryMedium};
    font-family: ${v.fonts.sans};
    width: 100%;
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
