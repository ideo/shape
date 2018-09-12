import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

import v from '~/utils/variables'

// TODO colors
export const QuestionText = styled.p`
  box-sizing: border-box;
  color: white !important;
  font-family: ${v.fonts.sans} !important;
  margin: 0;
  padding: 16px;
  width: 100%;
`

export const TestQuestionInput = css`
  background-color: ${props => (props.editable ? '#9FC1CB' : '#5698AE')};
  border: 0;
  box-sizing: border-box;
  color: white !important;
  font-family: ${v.fonts.sans} !important;
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
