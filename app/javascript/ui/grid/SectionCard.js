import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { inject, PropTypes as MobxPropTypes, observer } from 'mobx-react'
import { action, observable } from 'mobx'

import ActionMenu from '~/ui/grid/ActionMenu'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import {
  SectionCardWrapper,
  SectionTop,
  SectionLeft,
  SectionBottom,
  SectionRight,
  StyledTopRightActions,
} from '~/ui/grid/shared'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import EditableName from '~/ui/pages/shared/EditableName'
import { uiStore } from '~/stores'

@inject('uiStore')
@observer
class SectionCard extends React.Component {
  @observable
  actionMenuOpen = false

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

  @action
  onOpenActionMenu = () => {
    this.actionMenuOpen = true
  }

  @action
  onCloseActionMenu = () => {
    this.actionMenuOpen = false
  }

  @action
  updateSectionName = name => {
    const { card } = this.props
    card.section_name = name
    card.save()
  }

  render() {
    const { card, inMdl, uiStore, zoomLevel } = this.props
    const { section_name, can_edit_parent, isSelected } = card

    const cardWidth = uiStore.gridSettings.gridW / zoomLevel
    const smallCard = cardWidth < 160

    return (
      <SectionCardWrapper
        selected={isSelected}
        className="sectionCardWrapper"
        onMouseMove={this.onMouseMove}
      >
        <EditableName
          inline
          name={section_name || ''}
          placeholder={!section_name ? 'Section Title' : ''}
          updateNameHandler={this.updateSectionName}
          canEdit={can_edit_parent}
          fontSize={'3.5rem'}
          fieldName={`sectionName-${card.id}`}
        />
        <StyledTopRightActions
          color={this.actionsColor}
          className="show-on-hover"
          smallCard={smallCard}
          zoomLevel={zoomLevel}
        >
          <CardActionHolder tooltipText="select">
            <SelectionCircle cardId={card.id} />
          </CardActionHolder>
          <ActionMenu
            canView
            canEdit={card.can_edit_parent}
            canReplace={false}
            location="GridCard"
            className="show-on-hover"
            wrapperClassName="card-menu"
            card={card}
            menuOpen={this.actionMenuOpen}
            onOpen={this.onOpenActionMenu}
            onLeave={this.onCloseActionMenu}
            zoomLevel={zoomLevel}
          />
        </StyledTopRightActions>
        {!inMdl && (
          <Fragment>
            <SectionTop className="sectionInner" />
            <SectionLeft className="sectionInner" />
            <SectionBottom className="sectionInner" />
            <SectionRight className="sectionInner" />
          </Fragment>
        )}
      </SectionCardWrapper>
    )
  }
}

SectionCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  inMdl: PropTypes.bool.isRequired,
}
SectionCard.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SectionCard
