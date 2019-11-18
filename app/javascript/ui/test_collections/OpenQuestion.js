import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'
import {
  TextResponseHolder,
  TextInput,
  TextEnterButton,
} from '~/ui/test_collections/shared'

const QuestionSpacing = css`
  border-bottom-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
`

export const QuestionSpacingContainer = styled.div`
  ${QuestionSpacing};
`

@observer
class OpenQuestion extends React.Component {
  constructor(props) {
    super(props)
    const { questionAnswer } = props
    this.saveAnswer = _.debounce(this._saveAnswer, 1000)
    this.state = {
      response: questionAnswer ? questionAnswer.answer_text : '',
      focused: false,
    }
  }

  _saveAnswer = () => {
    const { onAnswer } = this.props
    onAnswer({ text: this.state.response, skipScrolling: true })
  }

  handleResponse = ev => {
    const { questionAnswer } = this.props

    this.setState(
      {
        response: ev.target.value,
      },
      () => {
        if (!questionAnswer || questionAnswer.answer_text.length === 0) {
          return
        }
        this.saveAnswer()
      }
    )
  }

  handleSubmit = ev => {
    const { editing, onAnswer } = this.props
    ev.preventDefault()
    if (editing) return
    onAnswer({ text: this.state.response })
  }

  renderQuestion() {
    const { editing, item, canEdit, handleFocus } = this.props

    return (
      <QuestionSpacingContainer editing={editing}>
        <QuestionContentEditor
          item={item}
          maxLength={100}
          placeholder="please enter question here"
          canEdit={canEdit}
          handleFocus={handleFocus}
          optional
        />
      </QuestionSpacingContainer>
    )
  }

  render() {
    const { editing } = this.props
    return (
      <div style={{ width: '100%' }}>
        {this.renderQuestion()}
        <form onSubmit={this.handleSubmit}>
          <TextResponseHolder>
            <TextInput
              onFocus={() => this.setState({ focused: true })}
              onChange={this.handleResponse}
              onBlur={() => this.setState({ focused: false })}
              value={this.state.response}
              type="questionText"
              placeholder="please enter your response"
              disabled={editing}
              data-cy="OpenQuestionTextInput"
            />
            <TextEnterButton
              focused={this.state.focused}
              data-cy="OpenQuestionTextButton"
            >
              <ArrowIcon rotation={90} />
            </TextEnterButton>
          </TextResponseHolder>
        </form>
      </div>
    )
  }
}

OpenQuestion.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  editing: PropTypes.bool,
  handleFocus: PropTypes.func,
  onAnswer: PropTypes.func,
  canEdit: PropTypes.bool,
}
OpenQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  handleFocus: () => true,
  onAnswer: () => null,
  canEdit: false,
}

export default OpenQuestion
