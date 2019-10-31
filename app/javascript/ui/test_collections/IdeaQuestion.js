import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'
import { showOnHoverCss } from '~/ui/grid/shared'
import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import v from '~/utils/variables'

const QuestionCardWrapper = styled.div`
  ${showOnHoverCss};
  position: relative;
  width: 100%;
`

const QuestionCardInner = styled.div`
  width: 100%;
  height: 100%;
`

const MediaWrapper = styled.div`
  border-top: 4px solid ${props => props.theme.borderColorEditing};
  border-bottom: 4px solid ${props => props.theme.borderColorEditing};
  height: ${props => props.minHeight}px;
  background-color: ${v.colors.commonLightest};
`

@inject('uiStore')
@observer
class IdeaQuestion extends React.Component {
  render() {
    const { card, parent, canEdit, uiStore } = this.props
    const { record } = card
    const showBCT =
      record.type === 'Item::QuestionItem' ||
      uiStore.blankContentToolState.replacingId === card.id
    let inner
    if (showBCT) {
      // this case means it is set to "blank / add your media"
      inner = (
        <GridCardBlank
          parent={parent}
          order={card.order}
          replacingId={card.id}
          testCollectionCard={card}
          defaultShowWholeImage
        />
      )
    } else {
      inner = (
        <GridCard
          card={card}
          cardType="items"
          record={card.record}
          menuOpen={uiStore.cardMenuOpen.id === card.id}
          testCollectionCard
        />
      )
    }
    const grid = showBCT ? uiStore.gridSettings : v.defaultGridSettings
    return (
      <QuestionCardWrapper>
        <QuestionContentEditor
          placeholder="add idea title here…"
          item={card.record}
          itemAttribute="name"
          canEdit={canEdit}
          maxLength={100}
        />
        <MediaWrapper minHeight={grid.gridH + grid.gutter}>
          <QuestionCardInner>{inner}</QuestionCardInner>
        </MediaWrapper>
        <QuestionContentEditor
          placeholder="add idea description here…"
          item={card.record}
          itemAttribute="content"
          canEdit={canEdit}
        />
      </QuestionCardWrapper>
    )
  }
}

IdeaQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool.isRequired,
}
IdeaQuestion.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
IdeaQuestion.displayName = 'IdeaQuestion'

export default IdeaQuestion
