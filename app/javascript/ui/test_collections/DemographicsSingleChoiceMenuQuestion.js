import AutoComplete from '~/ui//global/AutoComplete'
import { DemographicsQuestionHolder } from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'

class DemographicsSingleChoiceMenuQuestion extends DemographicsQuestionBase {
  state = {
    selectedChoice: null,
  }

  handleAnswer({ custom: choice }) {
    const {
      user,
      question,
      question: { userAttribute },
    } = this.props

    if (user) {
      console.log(user, question, userAttribute, choice)
      user.API_updateCurrentUser({
        [userAttribute]: choice,
      })
    }

    this.setState({
      selectedChoice: choice,
    })

    this.showNextQuestion()
  }

  render() {
    const { question } = this.props

    const autocompleteOptions = question.choices.map(({ text }, index) => ({
      value: text,
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
