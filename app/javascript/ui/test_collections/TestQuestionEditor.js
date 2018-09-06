import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

const selectOptions = [
  { value: 'context', label: 'Context Setting' },
  { value: 'media', label: 'Photo or Video of Idea' },
  { value: 'description', label: 'Idea Description' },
  { value: 'useful', label: 'Useful' },
  { value: 'open', label: 'Open Response' },
]

class TestQuestionEditor extends React.Component {
  renderQuestionItem() {
    const { item } = this.props
    switch (item.question_type) {
    case 'context':
      return (
        <div>
          How satisfied are you with your current solution?
        </div>
      )
    case 'blank_media':
      return (
        <div>
          Put some media here plz
        </div>
      )
    default:
      return ''
    }
  }

  isSelected(opt) {
    const { item } = this.props
    switch (opt.value) {
    case 'context':
    case 'open':
    case 'useful':
      return (item.type === 'Item::QuestionItem' && item.question_type === opt.value)
    case 'media':
      return (
        item.type === 'Item::QuestionItem' && (
          item.question_type === opt.value || item.question_type === 'blank_media'
        )
      )
    case 'Idea Description':
      return (item.type === 'Item::TextItem')
    default:
      return false
    }
  }

  renderQuestionSelectForm() {
    return (
      <select>
        { selectOptions.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
            selected={this.isSelected(opt)}
          >
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  renderQuestion() {
    const { item } = this.props
    switch (item.type) {
    case 'Item::QuestionItem':
      return this.renderQuestionItem()
    case 'Item::TextItem':
      return this.renderTextItem()
    default:
      return ''
    }
  }

  render() {
    return (
      <div>
        { this.renderQuestionSelectForm() }
        { this.renderQuestion() }
      </div>
    )
  }
}

TestQuestionEditor.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  position: PropTypes.string,
}
TestQuestionEditor.defaultProps = {
  position: null,
}

export default TestQuestionEditor
