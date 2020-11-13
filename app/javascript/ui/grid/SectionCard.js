import _ from 'lodash'
import { computed } from 'mobx'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'

import {
  SectionCardWrapper,
  SectionTop,
  SectionLeft,
  SectionBottom,
  SectionRight,
} from '~/ui/grid/shared'
import { uiStore } from '~/stores'

@observer
class SectionCard extends React.Component {
  setCardRef(ref) {
    if (!ref) return
    const { card } = this.props
    uiStore.setCardPosition(card.id, ref.getBoundingClientRect())
  }

  @computed
  get isSelected() {
    const { card } = this.props
    const selected = uiStore.isSelected(card.id)
    return selected
  }

  onMouseMove = ev => {
    // if we're hovering over the middle area of the wrapper
    // mark hoveringOverSection so we can bump the zIndex down in MovableGridCard
    // NOTE: this probably won't work on touch devices?
    if (_.includes(ev.target.classList, 'sectionCardWrapper')) {
      uiStore.update('hoveringOverSection', this.props.card.id)
    } else {
      uiStore.update('hoveringOverSection', null)
    }
  }

  render() {
    return (
      <SectionCardWrapper
        selected={this.isSelected}
        className="sectionCardWrapper"
        onMouseMove={this.onMouseMove}
        // needed for dragging selection square
        ref={r => this.setCardRef(r)}
      >
        <SectionTop className="sectionInner" />
        <SectionLeft className="sectionInner" />
        <SectionBottom className="sectionInner" />
        <SectionRight className="sectionInner" />
      </SectionCardWrapper>
    )
  }
}

SectionCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SectionCard
