import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import TestQuestionEditor from './TestQuestionEditor'

const TopThing = styled.div`
  background-color: ${v.colors.gray};
  border-radius: 7px 7px 0 0;
  height: 16px;
  margin-left: 320px;
  width: 374px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`
const BottomThing = TopThing.extend`
  border-radius: 0 0 7px 7px;
`

@observer
class TestDesigner extends React.Component {
  render() {
    const { collection, editing } = this.props
    const cardCount = collection.collection_cards.length
    const inner = (
      collection.collection_cards.map((card, i) => {
        let position
        if (i === 0) position = 'beginning'
        if (i === cardCount - 1) position = 'end'
        if (!editing) {
          card.record.menuDisabled = true
        }
        return (
          <TestQuestionEditor
            key={card.id}
            parent={collection}
            card={card}
            item={card.record}
            position={position}
            order={card.order}
            editing={editing}
          />
        )
      })
    )

    return (
      <div>
        {editing && <TopThing />}
        {inner}
        {editing && <BottomThing />}
      </div>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
}

export default TestDesigner
