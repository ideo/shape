import _ from 'lodash'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'

import {
  SectionCardWrapper,
  SectionTop,
  SectionLeft,
  SectionBottom,
  SectionRight,
} from '~/ui/grid/shared'
import EditableName from '~/ui/pages/shared/EditableName'
import { uiStore } from '~/stores'

@observer
class SectionCard extends React.Component {
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
    const { card } = this.props
    const { section_name, can_edit_parent, isSelected } = card

    return (
      <SectionCardWrapper
        selected={isSelected}
        className="sectionCardWrapper"
        onMouseMove={this.onMouseMove}
      >
        <EditableName
          name={section_name}
          updateNameHandler={n => console.log('should update', n)}
          canEdit={can_edit_parent}
          fontSize={'3.5rem'}
          fieldName="sectionName"
        />
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
