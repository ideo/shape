import PropTypes from 'prop-types'
import styled from 'styled-components'
import { FormControlLabel } from '@material-ui/core'

import { SmallHelperText, DisplayTextCss } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { validDemographicsCategories } from '~/ui/test_collections/RespondentDemographics'
import {
  QuestionText,
  QuestionSpacingContainer,
} from '~/ui/test_collections/shared'

const DemographicsResponseHolder = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 13px;
  width: 100%;
`

const DemographicsChoicesHolder = styled.div`
  padding-top: 1rem;
  padding-bottom: 1rem;
`

export const StyledFormControlLabel = styled(FormControlLabel)`
  .label {
    ${DisplayTextCss};
    color: ${v.colors.primaryDark};
  }
`

const StyledRoundChevronRight = styled.span`
  height: 30px;
  width: 30px;
  color: ${v.colors.white};
  background-color: ${v.colors.primaryDark};
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
  font-size: 1.6rem;
`

const NextQuestionButton = ({ onClick }) => (
  <button onClick={onClick}>
    <StyledRoundChevronRight>&#62;</StyledRoundChevronRight>
  </button>
)

NextQuestionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

export class DemographicsQuestionHolder extends React.Component {
  render() {
    const {
      children,
      instructions,
      question: { prompt },
    } = this.props

    return (
      <div style={{ width: '100%' }}>
        <QuestionSpacingContainer>
          <QuestionText>
            {prompt}
            <SmallHelperText
              color={v.colors.demographicsHint}
              style={{ display: 'block' }}
            >
              {instructions}
            </SmallHelperText>
          </QuestionText>
        </QuestionSpacingContainer>
        <DemographicsResponseHolder>
          <DemographicsChoicesHolder>{children}</DemographicsChoicesHolder>
          <div style={{ textAlign: 'right' }}>
            <NextQuestionButton onClick={() => this.props.onNextQuestion()} />
          </div>
        </DemographicsResponseHolder>
      </div>
    )
  }
}

export const QuestionShape = PropTypes.shape({
  prompt: PropTypes.string.isRequired,
  category: PropTypes.oneOf(validDemographicsCategories()).isRequired,
  choices: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
})

DemographicsQuestionHolder.propTypes = {
  question: QuestionShape.isRequired,
  children: PropTypes.node.isRequired,
  instructions: PropTypes.string.isRequired,
  onNextQuestion: PropTypes.func.isRequired,
}

export default DemographicsQuestionHolder
