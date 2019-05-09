import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'

import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

export const EmojiMessageContainer = styled.div`
  margin-top: 0px;
  font-size: 55px;
`

export const SurveyClosed = styled.div`
  border-radius: 7px;
  margin: 0 auto;
  background-color: ${props => props.theme.backgroundColor};
  width: 272px;
  padding: 30px;
  font-size: 1.25rem;
  font-family: ${v.fonts.sans};
  color: ${props => props.theme.descriptionText};
  text-align: center;
`
SurveyClosed.displayName = 'SurveyClosed'

export const QuestionText = styled.p`
  box-sizing: border-box;
  color: white !important;
  font-family: ${v.fonts.sans} !important;
  margin: 0;
  padding: 16px;
  width: 100%;
`

export const TextInputHolder = StyledCommentTextarea.extend`
  color: white;
  padding: 6px;
  background-color: ${props =>
    props.hasFocus
      ? props.theme.backgroundColorEditable
      : props.theme.backgroundColor};
  transition: background-color 0.2s;
`

export const TextResponseHolder = StyledCommentTextarea.extend`
  position: relative;
  background-color: ${props => props.theme.responseHolder};
  padding: 6px;
  /* to account for the arrow button */
  padding-right: 24px;
`

export const TextInput = styled(TextareaAutosize)`
  color: ${props => props.theme[props.type]};
  font-family: ${v.fonts.sans} !important;
  width: calc(100% - 20px);

  ::placeholder {
    color: ${props => props.theme[props.type]} !important;
    opacity: 1;
  }
}
`
TextInput.displayName = 'TextInput'

export const TestQuestionInput = css`
  background-color: ${props =>
    props.editable ? v.colors.primaryMedium : v.colors.primaryDark};
  border: 0;
  box-sizing: border-box;
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  outline: 0;
  resize: none;
  padding: 12px 12px 16px 12px;
  width: 100%;

  ::placeholder {
    color: white !important;
    opacity: 1;
  }
`

TestQuestionInput.propTypes = {
  editable: PropTypes.bool,
}
TestQuestionInput.defaultProps = {
  editable: false,
}

export const TestQuestionHolder = styled.div`
  background-color: ${props =>
    props.userEditable
      ? props.theme.backgroundColorEditable
      : props.theme.backgroundColor};
  border-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-width: 0;
  border-left-width: ${props => (props.editing ? '20px' : '0')};
  border-right-width: ${props => (props.editing ? '20px' : '0')};
  border-style: solid;
  border-top-width: ${props => (props.editing ? '10px' : 0)};
  margin-bottom: ${props => (props.editing ? 0 : '10px')};
  width: ${props => (props.editing ? '334px' : '100%')};

  /* this responsive resize only factors into the edit state */
  ${props =>
    props.editing &&
    `
    @media only screen
      and (max-width: ${v.responsive.medBreakpoint}px) {
      border-width: 0;
      margin-left: 22px;
      margin-right: 28px;
    }
  `} &:last {
    margin-bottom: 0;
  }
`

export const styledTestTheme = (themeName = 'primary') => {
  // primary theme used for TestType == Media (non-collection test w/ image/video)
  if (themeName === 'primary') {
    return {
      backgroundColor: v.colors.primaryDark,
      borderColor: v.colors.primaryMedium,
      borderColorEditing: v.colors.commonMedium,
      backgroundColorEditable: v.colors.primaryMedium,
      responseHolder: v.colors.commonLightest,
      descriptionText: v.colors.commonLightest,
      questionText: v.colors.primaryDark,
    }
  }
  // secondary theme used for TestType == Collection
  return {
    backgroundColor: v.colors.secondaryMedium,
    borderColor: v.colors.secondaryDark,
    borderColorEditing: v.colors.secondaryDark,
    backgroundColorEditable: v.colors.secondaryLight,
    responseHolder: v.colors.secondaryLight,
    questionText: v.colors.commonLightest,
    descriptionText: v.colors.commonLightest,
  }
}

export const TextEnterButton = styled.button`
  bottom: 14px;
  color: white;
  right: 18px;
  position: absolute;
  transition: opacity 0.3s;
  vertical-align: super;

  background-color: ${props => props.theme.questionText};
  border-radius: 50%;
  height: 32px;
  width: 32px;

  span {
    height: 50%;
    margin-top: 4px;
    width: 50%;
  }

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
    border: 2px solid ${v.colors.commonMedium};
    color: ${v.colors.commonMedium};

    &:hover {
      background: transparent;
      border: 2px solid ${v.colors.commonMedium};
      color: ${v.colors.commonMedium};
    }
  `};
`
