import AutoComplete from '~/ui//global/AutoComplete'
import { DemographicsQuestionHolder } from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'

class DemographicsSingleChoiceMenuQuestion extends DemographicsQuestionBase {
  state = {
    selectedChoice: null,
  }

  handleAnswer({ custom: choiceIndex }) {
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

    const autocompleteOptions = question.choices.map(({ text }, index) => ({
      value: `${index}`,
      label: text,
    }))

    return (
      <DemographicsQuestionHolder
        instructions="This question is optional."
        question={question}
        onNextQuestion={() => this.showNextQuestion()}
      >
        <AutoComplete
          value={this.setState.selectedChoice}
          options={autocompleteOptions}
          onOptionSelect={option => this.handleAnswer(option)}
          placeholder="TKTK"
        />
      </DemographicsQuestionHolder>
    )
  }
}

export default DemographicsSingleChoiceMenuQuestion
