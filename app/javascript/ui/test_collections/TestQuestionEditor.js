import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'

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
    const { parent, card, item } = this.props
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
        // this case means it is set to "blank / add your media"
        return (
          <GridCardBlank
            parent={parent}
            height={1}
            replacingId={card.id}
          />
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
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  position: PropTypes.string,
}
TestQuestionEditor.defaultProps = {
  position: null,
}

export default TestQuestionEditor
