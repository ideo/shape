import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import TextareaAutosize from 'react-autosize-textarea'
import styled, { css } from 'styled-components'

import ReturnArrowIcon from '~/ui/icons/ReturnArrowIcon'
import v from '~/utils/variables'
import { QuestionText, TestQuestionInput } from './shared'

const QuestionSpacing = css`
  border-bottom-color: ${props => (props.editable ? v.colors.gray : '#9ec1cc')};
  border-bottom-style: solid;
  border-bottom-width: 6px;
`

const QuestionTextWitSpacing = QuestionText.extend`
  ${QuestionSpacing}
`

const TextInput = styled(TextareaAutosize)`
  ${TestQuestionInput}
`

const EditTextInput = styled.input`
  ${TestQuestionInput}
  ${QuestionSpacing}
`

const TextEnterButton = styled.button`
  color: #5698AE;
  vertical-align: super;
  width: 15px;
`

@observer
class OpenQuestion extends React.Component {
  constructor(props) {
    super(props)
    this.saveEditing = _.debounce(this._saveEditing, 1000)
  }

  _saveEditing = () => {
    const { item } = this.props
    item.save()
  }

  answer = (name) => (ev) => {
  }

  handleEditingChange = (ev) => {
    const { item } = this.props
    item.content = ev.target.value
    this.saveEditing()
  }

  renderQuestion() {
    const { editing, item } = this.props
    let content
    if (editing) {
      content = (
        <EditTextInput
          editable
          onChange={this.handleEditingChange}
          placeholder="Write question here"
          value={item.content || ''}
          onBlur={this.save}
        />
      )
    } else {
      content = (
        <QuestionTextWitSpacing>
          {item.content}
        </QuestionTextWitSpacing>
      )
    }
    return content
  }

  render() {
    const { editing } = this.props
    return (
      <div style={{ width: '100%' }}>
        {this.renderQuestion()}
        <div>
          <TextInput placeholder="Write response here" disabled={editing} />
          <TextEnterButton onClick={this.answer}>
            <ReturnArrowIcon />
          </TextEnterButton>
        </div>
      </div>
    )
  }
}

OpenQuestion.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool,
}
OpenQuestion.defaultProps = {
  editing: false,
}

export default OpenQuestion
