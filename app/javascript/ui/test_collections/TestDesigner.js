import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import TestQuestionEditor from './TestQuestionEditor'

@observer
class TestDesigner extends React.Component {
  render() {
    const { collection } = this.props
    const cardCount = collection.collection_cards.length
    const inner = (
      collection.collection_cards.map((card, i) => {
        let position
        if (i === 0) position = 'beginning'
        if (i === cardCount - 1) position = 'end'
        return (
          <TestQuestionEditor
            key={card.id}
            parent={collection}
            card={card}
            item={card.record}
            position={position}
          />
        )
      })
    )

    return (
      <div>
        { inner }
      </div>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
