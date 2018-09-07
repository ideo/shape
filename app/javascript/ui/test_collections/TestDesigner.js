import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import TestQuestionEditor from './TestQuestionEditor'

const TopThing = styled.div`
  background-color: ${v.colors.gray};
  border-radius: 7px 7px 0 0 ;
  height: 16px;
  margin-left: 320px;
  width: 374px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

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
            order={card.order}
          />
        )
      })
    )

    return (
      <div>
        <TopThing />
        { inner }
      </div>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
