import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Checkbox, FormGroup } from '@material-ui/core'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'

import {
  DemographicsQuestionHolder,
  QuestionShape,
  StyledFormControlLabel,
} from './DemographicsQuestionHolder'

class DemographicsMultipleChoiceQuestion extends React.Component {
  state = {
    selections: [],
  }

  componentDidMount() {
    const {
      question: { choices },
    } = this.props

    this.setState({ selections: new Array(choices.length).fill(false) })
  }

  handleAnswer(choiceIndex, checked) {
    const {
      user,
      question: { category, choices },
    } = this.props

    // update selections
    const { selections } = this.state

    selections[choiceIndex] = checked

    this.setState({ selections })

    // update demographic tags
    const tags = choices
      .map((choice, index) => (selections[index] ? choice.tags : []))
      .flat()

    if (user) {
      user.API_updateCurrentUserDemographics({
        category,
        tags,
      })
    }
  }

  showNextQuestion() {
    const { onAnswer } = this.props
    onAnswer()
  }

  render() {
    const { question } = this.props

    return (
      <DemographicsQuestionHolder
        instructions="Please select all that apply. This question is optional."
        question={question}
        onNextQuestion={() => this.showNextQuestion()}
      >
        <FormGroup>
          {question.choices.map((choice, index) => (
            <StyledFormControlLabel
              key={index}
              classes={{ label: 'label' }}
              label={choice.text}
              labelPlacement="end"
              control={
                <Checkbox
                  checkedIcon={<CheckCircle />}
                  icon={<RadioButtonUnchecked />}
                  onChange={(_e, checked) => this.handleAnswer(index, checked)}
                />
              }
            />
          ))}
        </FormGroup>
      </DemographicsQuestionHolder>
    )
  }
}

DemographicsMultipleChoiceQuestion.propTypes = {
  question: QuestionShape.isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}

DemographicsMultipleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicsMultipleChoiceQuestion
