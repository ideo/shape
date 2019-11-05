import PropTypes from 'prop-types'
import styled from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'

import { SmallHelperText } from '~/ui/global/styled/typography'
import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

export const EmojiMessageContainer = styled.div`
  margin-top: 0px;
  font-size: 55px;
  text-align: center;
`

export const SurveyClosed = styled.div`
  border-radius: 7px;
  margin: 0 auto;
  background-color: ${props => props.theme.backgroundColor};
  width: 312px;
  padding: 30px;
  font-family: ${v.fonts.sans};
  color: ${props => props.theme.descriptionText};
`
SurveyClosed.displayName = 'SurveyClosed'

export const QuestionText = styled.p`
  box-sizing: border-box;
  color: white !important;
  font-family: ${v.fonts.sans} !important;
  font-size: ${props => props.fontSizeEm}em;
  margin: 0;
  padding: 16px;
  width: 100%;
`
QuestionText.propTypes = {
  fontSizeEm: PropTypes.number,
}

QuestionText.defaultProps = {
  fontSizeEm: 1,
}

export const TestQuestionBorder = styled.div`
  border-bottom: 4px solid ${props => props.theme.borderColorEditing};
`

export const TextInputHolder = styled(StyledCommentTextarea)`
  position: relative;
  color: white;
  padding: 6px;
  width: calc(100% - 12px);
  background-color: ${props =>
    props.hasFocus
      ? props.theme.backgroundColorEditable
      : props.theme.backgroundColor};
  transition: background-color 0.2s;
`

export const TextResponseHolder = styled(StyledCommentTextarea)`
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
    color: ${props => props.theme.placeholder} !important;
  }
}
`
TextInput.displayName = 'TextInput'

export const SingleLineInput = styled.input`
  color: ${props => props.theme[props.type]};
  font-family: ${v.fonts.sans} !important;
  width: calc(100% - 20px);

  ::placeholder {
    color: ${props => props.theme.placeholder} !important;
  }
`

export const TestQuestionHolder = styled.div`
  background-color: ${props =>
    props.userEditable
      ? props.theme.backgroundColorEditable
      : props.theme.backgroundColor};
  border-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-width: 0;
  border-left-width: ${props => (props.editing ? '10px' : '0')};
  border-right-width: ${props => (props.editing ? '10px' : '0')};
  border-style: solid;
  border-top-width: ${props => (props.editing ? '10px' : 0)};
  margin-bottom: ${props => (props.editing ? 0 : '10px')};
  width: ${props => (props.editing ? '334px' : '100%')};

  ${props =>
    props.editing &&
    props.firstCard &&
    `
    border-top-right-radius: 7px;
    border-top-left-radius: 7px;
  `}
  ${props =>
    props.editing &&
    props.lastCard &&
    `
    border-bottom-width: 10px;
    border-bottom-right-radius: 7px;
    border-bottom-left-radius: 7px;
  `}
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
  `}
`

export const styledTestTheme = (themeName = 'primary') => {
  // primary theme used for TestType == Media (non-collection test w/ image/video)
  if (themeName === 'primary') {
    return {
      backgroundColor: v.colors.primaryDarkest,
      borderColor: v.colors.primaryMedium,
      borderColorEditing: v.colors.primaryMedium,
      backgroundColorEditable: v.colors.primaryDark,
      responseHolder: v.colors.commonLightest,
      descriptionText: v.colors.commonLightest,
      placeholder: v.colors.primaryMedium,
      questionText: v.colors.primaryDark,
      hotEdge: v.colors.primaryLight,
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
    placeholder: v.colors.commonMediumTint,
    hotEdge: v.colors.primaryDarkest,
  }
}

export const QuestionHelperText = styled(SmallHelperText)`
  color: ${props => props.theme.placeholder};
  display: ${props => (props.block ? 'block' : 'inline')};
`

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
    transform: rotate(180deg);
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
      background-color: ${props.theme.questionText};
      border: none;
      color: white;
    }
  `};
`
