import AutoComplete from '~/ui//global/AutoComplete'
import { DemographicsQuestionHolder } from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'

const questionCategoryToApiParamMap = {
  countries: 'country',
  birth_year: 'birth_year',
}

const questionCategoryToPlaceholderTextMap = {
  countries: 'country',
  birth_year: 'YYYY',
}

function getApiParamForCategory(category) {
  return questionCategoryToApiParamMap[category]
}

function getPlaceholderTextForCategory(category) {
  return questionCategoryToPlaceholderTextMap[category]
}

class DemographicsSingleChoiceMenuQuestion extends DemographicsQuestionBase {
  state = {
    selectedChoice: null,
  }

  handleAnswer({ custom: choice }) {
    const { user, question } = this.props
    const apiParam = getApiParamForCategory(question.category)

    if (user) {
      user.API_updateCurrentUser({
        [apiParam]: choice,
      })
    }

    this.setState({
      selectedChoice: choice,
    })

    this.showNextQuestion()
  }

  render() {
    const { question } = this.props

    const placeholderText = getPlaceholderTextForCategory(question.category)
    const autocompleteOptions = question.choices.map(({ text }) => ({
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
          placeholder={placeholderText}
        />
      </DemographicsQuestionHolder>
    )
  }
}

export default DemographicsSingleChoiceMenuQuestion
