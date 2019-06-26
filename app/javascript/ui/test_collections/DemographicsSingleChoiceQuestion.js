import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Radio, RadioGroup } from '@material-ui/core'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'

import {
  DemographicsQuestionHolder,
  QuestionShape,
  StyledFormControlLabel,
} from './DemographicsQuestionHolder'

class DemographicsSingleChoiceQuestion extends React.Component {
  state = {
    selectedChoice: null,
  }

  handleAnswer(choiceIndex) {
    const {
      user,
      question: { category, choices },
    } = this.props

    const choice = choices[choiceIndex]

    if (user) {
      user.API_updateCurrentUserDemographics({
        category,
        tags: choice.tags,
      })
    }

    this.setState({
      selectedChoice: choiceIndex,
    })

    this.showNextQuestion()
  }

  showNextQuestion() {
    const { onAnswer } = this.props
    onAnswer()
  }

  render() {
    const { question } = this.props

    return (
      <DemographicsQuestionHolder
        instructions="This question is optional."
        question={question}
        onNextQuestion={() => this.showNextQuestion()}
      >
        <RadioGroup
          value={this.state.selectedChoice}
          onChange={(_e, value) => this.handleAnswer(value)}
        >
          {question.choices.map((choice, index) => (
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
      </DemographicsQuestionHolder>
    )
  }
}

DemographicsSingleChoiceQuestion.propTypes = {
  question: QuestionShape.isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}

DemographicsSingleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicsSingleChoiceQuestion
