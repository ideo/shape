import AutoComplete from '~/ui//global/AutoComplete'
import { DemographicsQuestionHolder } from '~/ui/test_collections/DemographicsQuestionHolder'
import DemographicsQuestionBase from '~/ui/test_collections/DemographicsQuestionBase'
import PropTypes from 'prop-types'

class DemographicsSingleChoiceMenuQuestion extends DemographicsQuestionBase {
  state = {
    selectedChoice: null,
  }

  handleAnswer({ custom: choice }) {
    const {
      user,
      question: { userAttribute },
    } = this.props

    if (user) {
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
    const { placeholderText, question } = this.props

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

DemographicsSingleChoiceMenuQuestion.propTypes = {
  placeholderText: PropTypes.string.isRequired,
}

export default DemographicsSingleChoiceMenuQuestion
