import { Checkbox, FormGroup } from '@material-ui/core'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'

import {
  DemographicsQuestionHolder,
  StyledFormControlLabel,
} from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'

class DemographicsMultipleChoiceQuestion extends DemographicsQuestionBase {
  state = {
    selections: [],
  }

  componentDidMount() {
    const {
      question: { choices },
    } = this.props

    this.setState({ selections: new Array(choices.length).fill(false) })
  }

  onChange(choiceIndex, checked) {
    // update selections
    const { selections } = this.state

    selections[choiceIndex] = checked

    this.setState({ selections })

    // update demographic tags
    const {
      question: { category, choices },
    } = this.props

    const tags = choices
      .map((choice, index) => (selections[index] ? choice.tags : []))
      .flat()

    this.updateUserDemographics({
      category,
      tags,
    })
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
                  onChange={(_e, checked) => this.onChange(index, checked)}
                />
              }
            />
          ))}
        </FormGroup>
      </DemographicsQuestionHolder>
    )
  }
}

export default DemographicsMultipleChoiceQuestion
