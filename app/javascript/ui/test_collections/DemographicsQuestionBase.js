import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { validDemographicsCategories } from '~/ui/test_collections/RespondentDemographics'

class DemographicsQuestionBase extends React.Component {
  updateUserDemographics({ category, tags }) {
    const { user } = this.props
    if (user) {
      user.API_updateCurrentUserDemographics({ category, tags })
    }
  }

  showNextQuestion() {
    const { onAnswer } = this.props
    onAnswer()
  }
}

export const QuestionShape = PropTypes.shape({
  prompt: PropTypes.string.isRequired,
  category: PropTypes.oneOf(validDemographicsCategories()).isRequired,
  choices: MobxPropTypes.observableArrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      tags: MobxPropTypes.observableArrayOf(PropTypes.string).isRequired,
    })
  ),
})

DemographicsQuestionBase.propTypes = {
  question: QuestionShape.isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}

DemographicsQuestionBase.defaultProps = {
  user: null,
}

export default DemographicsQuestionBase
