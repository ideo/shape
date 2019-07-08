import { Radio, RadioGroup } from '@material-ui/core'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'

import {
  DemographicsQuestionHolder,
  StyledFormControlLabel,
} from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'

class DemographicsSingleChoiceMenuQuestion extends DemographicsQuestionBase {
  state = {
    selectedChoice: null,
  }

  handleAnswer(choiceIndex) {
    this.setState({
      selectedChoice: choiceIndex,
    })

    const {
      question: { category, choices },
    } = this.props

    const choice = choices[choiceIndex]

    this.updateUserDemographics({ category, tags: choice.tags })

    this.showNextQuestion()
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

export default DemographicsSingleChoiceMenuQuestion
