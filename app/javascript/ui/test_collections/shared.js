import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'

import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

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
    props.hasFocus ? v.colors.testLightBlueBg : v.colors.ctaButtonBlue};
  transition: background-color 0.2s;
`

export const TextResponseHolder = StyledCommentTextarea.extend`
  position: relative;
  background-color: ${v.colors.desert};
  padding: 6px;
  /* to account for the arrow button */
  padding-right: 24px;
`

export const TextInput = styled(TextareaAutosize)`
  color: ${props => (props.color ? props.color : 'white')};
  font-family: ${v.fonts.sans} !important;
  width: calc(100% - 20px);

  ::placeholder {
    color: ${props => (props.color ? 'inherit' : 'white !important')};
    opacity: 1;
  }
}
`
TextInput.displayName = 'TextInput'

export const TestQuestionInput = css`
  background-color: ${props =>
    props.editable ? v.colors.testLightBlueBg : v.colors.ctaButtonBlue};
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
    props.userEditable ? v.colors.testLightBlueBg : v.colors.ctaButtonBlue};
  border-color: ${props =>
    props.editing ? v.colors.gray : v.colors.testLightBlueBg};
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
