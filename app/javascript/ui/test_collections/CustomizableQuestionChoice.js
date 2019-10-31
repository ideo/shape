import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { Checkbox, Radio } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const ChoiceHolder = styled.div`
  background: ${v.colors.commonLight};
  padding: 12px 17px;
  vertical-align: baseline;

  &:hover {
    background: white;
  }
`
class CustomizableQuestionChoice extends React.Component {
  get isChecked() {
    const { questionAnswer, choice } = this.props

    if (!questionAnswer) return false

    return questionAnswer.selected_choice_ids.includes(choice.id)
  }

  render() {
    const { choice, questionType, onChange } = this.props

    return (
      <ChoiceHolder>
        {questionType === 'question_single_choice' ? (
          <Radio
            checked={this.isChecked}
            onChange={onChange}
            value={choice.value}
            color="primary"
          />
        ) : (
          <Checkbox
            checked={this.isChecked}
            onChange={onChange}
            value={choice.value}
            color="primary"
          />
        )}
        <DisplayText color={v.colors.commonDark}>{choice.text}</DisplayText>
      </ChoiceHolder>
    )
  }
}

CustomizableQuestionChoice.propTypes = {
  onChange: PropTypes.func.isRequired,
  questionType: PropTypes.string.isRequired,
  choice: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
}

CustomizableQuestionChoice.defaultProps = {
  questionAnswer: null,
}

export default CustomizableQuestionChoice
