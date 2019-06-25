import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'

import { SmallHelperText, DisplayTextCss } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { validDemographicsCategories } from '~/ui/test_collections/RespondentDemographics'
import {
  QuestionText,
  QuestionSpacingContainer,
} from '~/ui/test_collections/shared'

// TODO duplication
const Scale = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 13px;
  width: 100%;
`

const StyledFormControlLabel = styled(FormControlLabel)`
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

const SkipButton = ({ onClick }) => (
  <button onClick={onClick}>
    <StyledRoundChevronRight>&#62;</StyledRoundChevronRight>
  </button>
)
SkipButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

@observer
class DemographicsSingleChoiceQuestion extends React.Component {
  state = {
    selectedChoice: null,
  }

  handleAnswer(choiceIndex) {
    const {
      onAnswer,
      user,
      question: { category, choices },
    } = this.props

    const choice = choices[choiceIndex]

    onAnswer({ text: choice.text })

    user.API_updateCurrentUserDemographics({
      category,
      tags: choice.tags,
    })

    this.setState({
      selectedChoice: choiceIndex,
    })
  }

  skipQuestion() {
    const { onAnswer } = this.props
    onAnswer({})
  }

  render() {
    const {
      question: { prompt, choices },
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
              This question is optional.
            </SmallHelperText>
          </QuestionText>
        </QuestionSpacingContainer>
        <Scale>
          <RadioGroup
            value={this.state.selectedChoice}
            onChange={(_e, value) => this.handleAnswer(value)}
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
            }}
          >
            {choices.map((choice, index) => (
              <StyledFormControlLabel
                key={index}
                value={index.toString()}
                classes={{ label: 'label' }}
                label={choice.text}
                labelPlacement="end"
                control={
                  <Radio
                    checkedIcon={<CheckCircle />}
                    icon={<RadioButtonUnchecked />}
                  />
                }
              />
            ))}
          </RadioGroup>
          <div style={{ textAlign: 'right' }}>
            <SkipButton onClick={_e => this.skipQuestion()} />
          </div>
        </Scale>
      </div>
    )
  }
}

DemographicsSingleChoiceQuestion.propTypes = {
  question: PropTypes.shape({
    prompt: PropTypes.string.isRequired,
    category: PropTypes.oneOf(validDemographicsCategories()).isRequired,
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ),
  }).isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}
DemographicsSingleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicsSingleChoiceQuestion
