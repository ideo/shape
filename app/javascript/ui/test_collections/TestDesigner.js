import { PropTypes as MobxPropTypes } from 'mobx-react'

import TestQuestionEditor from './TestQuestionEditor'

class TestDesigner extends React.Component {
  render() {
    const { collection } = this.props
    const cardCount = collection.collection_cards.length
    return (
      collection.collection_cards.map((card, i) => {
        let position
        if (i === 0) position = 'beginning'
        if (i === cardCount - 1) position = 'end'
        return (
          <TestQuestionEditor
            key={card.id}
            item={card.record}
            position={position}
          />
        )
      })
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
