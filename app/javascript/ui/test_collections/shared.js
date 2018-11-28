import _ from 'lodash'
import PropTypes from 'prop-types'
import objectAssignDeep from 'object-assign-deep'
import styled, { css } from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'
import { VictoryTheme } from 'victory'

import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

const colorScale = [v.colors.tertiaryMedium, v.colors.primaryLight]
export const themeLabelStyles = {
  fontFamily: v.fonts.sans,
  fontSize: '18px',
  padding: 10,
  fill: v.colors.black,
  stroke: 'transparent',
  textTransform: 'uppercase',
}
export const theme = objectAssignDeep({}, VictoryTheme.grayscale, {
  bar: {
    style: {
      labels: Object.assign({}, themeLabelStyles, {
        fill: v.colors.tertiaryMedium,
        fontSize: 14,
      }),
    },
  },
  area: {
    style: {
      labels: Object.assign({}, themeLabelStyles, {
        fill: v.colors.tertiaryMedium,
      }),
    },
  },
  axis: {
    style: {
      tickLabels: themeLabelStyles,
    },
  },
  group: {
    colorScale,
  },
  legend: {
    colorScale,
    fontSize: 14,
    gutter: 10,
    style: {
      data: {
        type: 'square',
      },
      labels: Object.assign({}, themeLabelStyles, {
        fontSize: 10.5,
      }),
      border: {
        fill: 'rgba(255, 255, 255, 0.5)',
      },
      title: themeLabelStyles,
    },
  },
})

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

export const emojiSeriesMap = {
  usefulness: [
    { number: 1, name: 'Very useless', symbol: '👎' },
    { number: 2, name: 'Somewhat useless', scale: 0.6, symbol: '👎' },
    { number: 3, name: 'Somewhat useful', scale: 0.6, symbol: '👍' },
    { number: 4, name: 'Very useful', symbol: '👍' },
  ],
  satisfaction: [
    { number: 1, name: 'Very unsatisfied', symbol: '😡' },
    { number: 2, name: 'Somewhat unsatisfied', scale: 0.6, symbol: '☹️' },
    { number: 3, name: 'Mostly Satisfied', scale: 0.6, symbol: '😊' },
    { number: 4, name: 'Very satisfied', symbol: '😍' },
  ],
  clarity: [
    { number: 1, name: 'Totally unclear', symbol: '🤷‍♀️' },
    { number: 2, name: 'Somewhat unclear', scale: 0.6, symbol: '🕶' },
    { number: 3, name: 'Mostly clear', scale: 0.6, symbol: '👓' },
    { number: 4, name: 'Totally clear', symbol: '🔬' },
  ],
  excitement: [
    { number: 1, name: 'Totally unexciting', symbol: '😴' },
    { number: 2, name: 'Unexciting', scale: 0.6, symbol: '😔' },
    { number: 3, name: 'Exciting', scale: 0.6, symbol: '🙂' },
    { number: 4, name: 'Totally exciting', symbol: '😍' },
  ],
  different: [
    { number: 1, name: 'Not at all different', symbol: '😏' },
    { number: 2, name: 'Not very different', scale: 0.6, symbol: '😐' },
    { number: 3, name: 'Different', scale: 0.6, symbol: '😲' },
    { number: 4, name: 'Very different', symbol: '🤯' },
  ],
}

export const questionInformation = question => {
  const questionType = question.question_type
  let emojiSeriesName
  let questionText
  let questionTitle
  switch (questionType) {
    case 'question_useful':
      emojiSeriesName = 'usefulness'
      questionText = 'How useful is this idea for you?'
      questionTitle = 'Usefulness'
      break
    case 'question_clarity':
      emojiSeriesName = 'clarity'
      questionText = 'How clear is this idea for you?'
      questionTitle = 'Clarity'
      break
    case 'question_excitement':
      emojiSeriesName = 'excitement'
      questionText = 'How exciting is this idea for you?'
      questionTitle = 'Excitement'
      break
    case 'question_different':
      emojiSeriesName = 'different'
      questionText = "How different is this idea from what you've seen before?"
      questionTitle = 'Different'
      break
    case 'question_category_satisfaction':
      emojiSeriesName = 'satisfaction'
      // the category text gets added later within ScaleQuestion
      questionText = 'How satisifed are you with your current'
      questionTitle = 'Category Satisfaction'
      break
    case 'question_context':
    default:
      emojiSeriesName = 'satisfaction'
      questionText = 'How satisfied are you with your current solution?'
      questionTitle = 'Context'
      break
  }
  const emojiSeries = emojiSeriesMap[emojiSeriesName]

  return {
    emojiSeries,
    emojiSeriesName,
    questionText,
    questionTitle,
  }
}

export const questionTitle = question_type => {
  if (question_type !== 'total') {
    const info = questionInformation({ question_type })
    return info.questionTitle
  }
  return _.startCase(question_type)
}

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
