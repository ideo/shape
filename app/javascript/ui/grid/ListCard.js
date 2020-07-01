import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { action, computed, observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ActionMenu from '~/ui/grid/ActionMenu'
import AddReviewersPopover from '~/ui/challenges/AddReviewersPopover'
import AvatarList from '~/ui/users/AvatarList'
import CollectionIconXs from '~/ui/icons/CollectionIconXs'
import CollectionTypeIcon, {
  collectionTypeToIcon,
} from '~/ui/global/CollectionTypeIcon'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import FileIcon from '~/ui/grid/covers/FileIcon'
import { highlightedCardCss } from '~/ui/grid/shared'
import LinkIcon from '~/ui/icons/LinkIcon'
import ListCoverRenderer from '~/ui/grid/ListCoverRenderer'
import RolesSummary from '~/ui/roles/RolesSummary'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import TextIconXs from '~/ui/icons/TextIconXs'
import VideoIcon from '~/ui/icons/VideoIcon'
import { defaultTimeFormat } from '~/utils/time'
import { DisplayTextCss } from '~/ui/global/styled/typography'
import { routingStore, uiStore } from '~/stores'
import { openContextMenu } from '~/utils/clickUtils'
import v, { ITEM_TYPES } from '~/utils/variables'

export const Column = styled.div`
  ${DisplayTextCss}
  align-items: center;
  display: flex;
  margin-left: ${props => props.marginLeft};
  width: ${props => props.width};
`

Column.defaultProps = {
  marginLeft: '0',
  width: 'auto',
}

const Row = styled.div`
  align-items: center;
  height: 50px;
  display: flex;
  margin-bottom: 8px;
  position: relative;

  ${props =>
    !props.selected &&
    `
    ${Column} > .show-on-hover {
      display: none;
    }
  `}

  &:hover {
    ${Column} > .show-on-hover {
      display: flex;
    }
  }

  *::selection {
    background: transparent;
  }

  ${props =>
    props.selected &&
    `
  &:before {
    ${highlightedCardCss}
  }
  `};
`

const ColumnLink = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
`
ColumnLink.displayName = 'ColumnLink'

const TruncatedName = styled.span`
  display: inline-block;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380px;
`

const IconHolder = styled.div`
  color: ${v.colors.commonDark};
  display: flex;
  height: 16px;
  margin-left: 8px;
  width: 16px;
`

@observer
class ListCard extends React.Component {
  @observable
  menuItemCount = 1
  @observable
  isReviewersOpen = false

  constructor(props) {
    super(props)
    this.rolesWrapperRef = React.createRef()
  }

  @computed
  get menuOpen() {
    return uiStore.actionMenuOpenForCard(this.props.card.id)
  }

  get isSelected() {
    const { card } = this.props
    return uiStore.isSelected(card.id)
  }

  @action
  setMenuItemsCount = count => {
    // counts menuitems in actionmenu
    this.menuItemCount = count
  }

  handleRecordClick = ev => {
    const { card } = this.props
    ev.preventDefault()
    ev.stopPropagation()
    if (uiStore.captureKeyboardGridClick(ev, card.id)) {
      return
    }
    routingStore.routeTo(card.record.internalType, card.record.id)
  }

  handleRowClick = ev => {
    const { card } = this.props
    ev.preventDefault()
    ev.stopPropagation()
    if (uiStore.captureKeyboardGridClick(ev, card.id)) {
      return
    }
    uiStore.toggleSelectedCardId(card.id)
  }

  handleContextMenu = ev => {
    const { menuItemCount, props } = this
    const { card } = props

    ev.preventDefault()
    if (uiStore.isAndroid) return false

    return openContextMenu(ev, card, {
      targetRef: this.cardRef,
      onOpenMenu: uiStore.openContextMenu,
      menuItemCount,
    })
  }

  handleActionMenuClick = ev => {
    const { card } = this.props
    ev.stopPropagation()

    uiStore.openContextMenu(ev, {
      card,
    })
  }

  handleCloseMenu = () => {
    // this happens when you mouse off the ActionMenu
    if (this.menuOpen) {
      // if we right-clicked, keep the menu open
      if (!uiStore.cardMenuOpenAndPositioned) {
        uiStore.closeCardMenu()
      }
    }
  }

  handleRolesClick = ev => {
    const {
      card: { record },
      insideChallenge,
    } = this.props
    ev.stopPropagation()
    if (insideChallenge) {
      runInAction(() => {
        this.isReviewersOpen = true
      })
      return
    }
    uiStore.update('rolesMenuOpen', record)
  }

  handleCloseReviewers = ev => {
    runInAction(() => {
      this.isReviewersOpen = false
    })
  }

  get taggedUsers() {
    const {
      card: { record },
    } = this.props
    if (!record.tagged_users) return []
    return record.tagged_users
  }

  get renderLabelSelector() {
    const {
      card: { record },
    } = this.props

    if (!record.allowsCollectionTypeSelector) {
      return null
    }

    return (
      <CollectionTypeSelector collection={record} location={'PageHeader'}>
        <IconHolder>
          {collectionTypeToIcon({
            type: record.collection_type,
            size: 'lg',
          })}
        </IconHolder>
      </CollectionTypeSelector>
    )
  }

  get showReviewers() {
    const {
      card: { record },
      insideChallenge,
    } = this.props
    return insideChallenge && record.internalType !== 'items'
  }

  get canEditCard() {
    const { card, searchResult } = this.props
    if (searchResult) return false
    // you can always edit your link cards, regardless of record.can_edit
    if (card.parentCollection && card.parentCollection.can_edit && card.link)
      return true
    return card.record.can_edit
  }

  get renderIcons() {
    const { card } = this.props
    if (card.record.isCollection && !card.record.allowsCollectionTypeSelector) {
      return (
        <Fragment>
          <IconHolder>
            <CollectionIconXs />
          </IconHolder>
          <IconHolder>
            <CollectionTypeIcon record={card.record} />
          </IconHolder>
        </Fragment>
      )
    }
    let icon = null
    switch (card.record.type) {
      case ITEM_TYPES.TEXT:
        icon = <TextIconXs />
        break
      case ITEM_TYPES.FILE:
        icon = <FileIcon mimeType={card.record.filestack_file.mimetype} />
        break
      case ITEM_TYPES.VIDEO:
        icon = <VideoIcon />
        break
      case ITEM_TYPES.LINK:
        icon = <LinkIcon />
        break
    }
    return <IconHolder>{icon}</IconHolder>
  }

  render() {
    const { card, searchResult } = this.props
    const { record } = card
    if (card.shouldHideFromUI || _.isEmpty(card.record)) {
      return null
    }

    return (
      <Row
        onClick={this.handleRowClick}
        onContextMenu={this.handleContextMenu}
        selected={this.isSelected}
        ref={c => (this.cardRef = c)}
        data-cy="ListCardRow"
      >
        <Column width="50px">
          <div className="show-on-hover" style={{ cursor: 'pointer' }}>
            <SelectionCircle cardId={card.id} />
          </div>
        </Column>
        <Column width="500px">
          <ColumnLink onClick={this.handleRecordClick}>
            <ListCoverRenderer
              card={card}
              cardType={record.internalType}
              record={record}
            />
            <TruncatedName>{record.name}</TruncatedName>
            {this.renderLabelSelector}
            {this.renderIcons}
          </ColumnLink>
        </Column>
        <Column width="400px">{defaultTimeFormat(record.updated_at)}</Column>
        <Column width="250px">
          <div ref={this.rolesWrapperRef} style={{ width: '100%' }}>
            {this.showReviewers ? (
              <AvatarList
                avatars={this.taggedUsers}
                onAdd={this.handleRolesClick}
              />
            ) : (
              <RolesSummary
                key="roles"
                handleClick={this.handleRolesClick}
                roles={[...record.roles]}
                canEdit={record.can_edit}
                // convert observable to normal array to trigger render changes
                collaborators={[...record.collaborators]}
                rolesMenuOpen={!!uiStore.rolesMenuOpen}
              />
            )}
            {this.showReviewers && (
              <AddReviewersPopover
                record={record}
                onClose={this.handleCloseReviewers}
                wrapperRef={this.rolesWrapperRef}
                open={this.isReviewersOpen}
              />
            )}
          </div>
        </Column>
        {/* stopPropagation so that ActionMenu overrides handleRowClick */}
        <Column marginLeft="auto" onClick={e => e.stopPropagation()}>
          <ActionMenu
            location={searchResult ? 'Search' : 'GridCard'}
            card={card}
            canView={record.can_view}
            canEdit={this.canEditCard}
            canReplace={record.canReplace && !card.link && !searchResult}
            menuOpen={this.menuOpen}
            onOpen={this.handleActionMenuClick}
            onLeave={this.handleCloseMenu}
            menuItemsCount={this.getMenuItemsCount}
          />
        </Column>
      </Row>
    )
  }
}
ListCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  insideChallenge: PropTypes.bool,
  searchResult: PropTypes.bool,
}
ListCard.defaultProps = {
  insideChallenge: false,
  searchResult: false,
}

export default ListCard
