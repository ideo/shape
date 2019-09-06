import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import DescriptionQuestion from './DescriptionQuestion'
import {
  QuestionText,
  TextResponseHolder,
  TextInput,
  TextEnterButton,
} from './shared'

const QuestionSpacing = css`
  border-bottom-color: ${props =>
    props.editing ? props.theme.borderColorEditing : props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
`

export const QuestionSpacingContainer = styled.div`
  ${QuestionSpacing};
`

const QuestionTextWithSpacing = styled(QuestionText)`
  ${QuestionSpacing};
`
QuestionTextWithSpacing.displayName = 'QuestionTextWithSpacing'

@observer
class OpenQuestion extends React.Component {
  constructor(props) {
    super(props)
    const { questionAnswer } = props
    this.save = _.debounce(this._save, 1000)
    this.state = {
      response: questionAnswer ? questionAnswer.answer_text : '',
      focused: false,
    }
  }

  _save = () => {
    const { item } = this.props
    item.save()
  }

  handleResponse = ev => {
    this.setState({
      response: ev.target.value,
    })
  }

  handleSubmit = ev => {
    const { editing, onAnswer } = this.props
    ev.preventDefault()
    if (editing) return
    onAnswer({ text: this.state.response })
  }

  renderQuestion() {
    const { editing, item, canEdit } = this.props
    let content
    if (editing) {
      content = (
        <QuestionSpacingContainer editing={editing}>
          <DescriptionQuestion
            item={item}
            maxLength={100}
            placeholder="this question is optional"
            canEdit={canEdit}
          />
        </QuestionSpacingContainer>
      )
    } else {
      content = (
        <QuestionTextWithSpacing>{item.content}</QuestionTextWithSpacing>
      )
    }
    return content
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
              placeholder="this question is optional"
              disabled={editing}
              data-cy="OpenQuestionTextInput"
            />
            <TextEnterButton
              focused={this.state.focused}
              data-cy="OpenQuestionTextButton"
            >
              <ArrowIcon />
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
  onAnswer: PropTypes.func,
  canEdit: PropTypes.bool,
}
OpenQuestion.defaultProps = {
  questionAnswer: null,
  editing: false,
  onAnswer: () => null,
  canEdit: false,
}

export default OpenQuestion
