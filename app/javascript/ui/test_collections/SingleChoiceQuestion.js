import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { QuestionSpacingContainer } from '~/ui/test_collections/OpenQuestion'
import { TextResponseHolder, QuestionText } from '~/ui/test_collections/shared'
import RadioControl from '~/ui/global/RadioControl'
import { observable, runInAction } from 'mobx'

@observer
class SingleChoiceQuestion extends React.Component {
  @observable
  selectedValue = ''

  handleClick = choice => ev => {
    const { onAnswer } = this.props
    ev.preventDefault()

    runInAction(() => {
      this.selectedValue = choice
    })

    onAnswer(choice)
  }

  render() {
    const { questionText, choices } = this.props

    return (
      <QuestionSpacingContainer>
        <QuestionText>{questionText}</QuestionText>
        <p>please select one option</p>
        <TextResponseHolder>
          <RadioControl
            name={`question_single_choice_`}
            onChange={this.handleClick}
            options={choices}
            selectedValue={this.selectedValue}
          />
        </TextResponseHolder>
      </QuestionSpacingContainer>
    )
  }
}

SingleChoiceQuestion.propTypes = {
  questionText: PropTypes.string.isRequired,
  choices: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject).isRequired,
  onAnswer: PropTypes.func.isRequired,
  selectedValue: PropTypes.string,
  name: PropTypes.string,
}

SingleChoiceQuestion.defaultProps = {
  selectedValue: '',
  name: '',
}

export default SingleChoiceQuestion
