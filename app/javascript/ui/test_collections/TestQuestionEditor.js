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
  handleSelectChange = (ev) => {
    // console.log(ev.target.value)
    // TODO: call replace on the card with the new type??
  }

  renderQuestionSelectForm() {
    const { card } = this.props
    return (
      <select
        value={card.card_question_type}
        onChange={this.handleSelectChange}
      >
        { selectOptions.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  renderQuestion() {
    const { card, item } = this.props
    switch (card.card_question_type) {
    case 'context':
    case 'useful':
      return (
        <div>
          How satisfied are you with your current solution?
        </div>
      )
    case 'media':
      if (item.type === 'Item::QuestionItem') {
        return (
          <div>
            Put some media here plz
          </div>
        )
      }
      return 'your media is ready sir!'
    case 'description':
      return (
        <textarea />
      )
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
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  position: PropTypes.string,
}
TestQuestionEditor.defaultProps = {
  position: null,
}

export default TestQuestionEditor
