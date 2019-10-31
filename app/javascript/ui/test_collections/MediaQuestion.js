import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import { showOnHoverCss } from '~/ui/grid/shared'
import v from '~/utils/variables'

const MediaWrapper = styled.div`
  ${showOnHoverCss}
  border-top: 4px solid ${props => props.theme.borderColorEditing};
  border-bottom: 4px solid ${props => props.theme.borderColorEditing};
  height: ${props => props.minHeight}px;
  background-color: ${v.colors.commonLightest};
`

@inject('uiStore')
@observer
class MediaQuestion extends React.Component {
  render() {
    const { card, parent, uiStore } = this.props
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
      <MediaWrapper minHeight={grid.gridH + grid.gutter}>{inner}</MediaWrapper>
    )
  }
}

MediaQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}
MediaQuestion.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MediaQuestion.displayName = 'MediaQuestion'

export default MediaQuestion
