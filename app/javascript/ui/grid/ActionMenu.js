import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import AddIntoIcon from '~/ui/icons/AddIntoIcon'
import Activity from '~/stores/jsonApi/Activity'
import DownloadIcon from '~/ui/icons/DownloadIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import MoveIcon from '~/ui/icons/MoveIcon'
import ReplaceIcon from '~/ui/icons/ReplaceIcon'
import CommentIcon from '~/ui/icons/CommentIcon'
import PrintIcon from '~/ui/icons/PrintIcon'
import SelectAllIcon from '~/ui/icons/SelectAllIcon'
import SettingsIcon from '~/ui/icons/SettingsIcon'
import SharingIcon from '~/ui/icons/SharingIcon'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagIcon from '~/ui/icons/TagIcon'
import TrashIconXl from '~/ui/icons/TrashIconXl'
import { findBottomRowCards } from '~/utils/CollectionGridCalculator'

@inject('uiStore', 'apiStore')
@observer
class ActionMenu extends React.Component {
  @observable
  itemLoading = ''

  @action
  setLoading(name = '') {
    this.itemLoading = name
  }

  callCardAction = async (name, methodName) => {
    const { uiStore, card } = this.props
    uiStore.selectCardId(card.id)
    uiStore.closeMoveMenu({ deselect: false })
    const onCancel = () => {
      uiStore.toggleSelectedCardId(card.id)
    }
    this.setLoading(name)
    const result = await card[methodName]({ onCancel })
    this.setLoading()
    return result
  }

  replaceCard = () => {
    this.props.uiStore.closeMoveMenu()
    const { card } = this.props
    card.beginReplacing()
  }

  get viewingCollection() {
    const { card, uiStore } = this.props
    return uiStore.viewingCollection || card.parentCollection
  }

  openMoveMenu = cardAction => {
    const { card, onMoveMenu, uiStore } = this.props
    const { viewingCollection } = this
    if (onMoveMenu) onMoveMenu({ type: cardAction })
    uiStore.selectCardId(card.id)
    if (cardAction === 'move') {
      uiStore.reselectOnlyMovableCards()
    }
    uiStore.openMoveMenu({ from: viewingCollection, cardAction })
  }

  closeCardMenu = () => {
    this.props.uiStore.closeCardMenu()
  }

  duplicateCard = () => {
    this.openMoveMenu('duplicate')
  }

  moveCard = () => {
    const { card, uiStore } = this.props
    const collection = card.parentCollection
    collection.confirmEdit({
      onCancel: () => uiStore.closeMoveMenu(),
      onConfirm: () => this.openMoveMenu('move'),
    })
  }

  linkCard = () => {
    this.openMoveMenu('link')
  }

  addToMyCollection = () => {
    this.callCardAction('Add to My Collection', 'API_linkToMyCollection')
  }

  archiveCard = async () => {
    const { afterArchive } = this.props
    const result = await this.callCardAction('Delete', 'API_archive')
    if (afterArchive && result) afterArchive({ type: 'archive' })
  }

  selectAll = () => {
    const { uiStore, location, card } = this.props
    uiStore.selectAll({ location, card })
  }

  showTags = () => {
    const { card, uiStore } = this.props
    if (card.record.can_edit) {
      // you can't select a mix of editable and non-editable for tagging
      uiStore.reselectOnlyEditableRecords()
    }
    uiStore.update('tagsModalOpenId', card.id)
  }

  downloadCard = () => {
    const { card } = this.props
    const { record } = card
    if (record.filestack_file) {
      Activity.trackActivity('downloaded', record)
      window.open(record.filestack_file.url, '_blank')
    }
  }

  showRolesMenu = () => {
    const { uiStore, card } = this.props
    uiStore.update('rolesMenuOpen', card.record)
  }

  handleMouseLeave = () => {
    this.props.onLeave()
  }

  toggleOpen = e => {
    e.stopPropagation()
    this.props.onOpen(e)
  }

  openSubmissionBoxSettings = () => {
    const { uiStore } = this.props
    uiStore.update('submissionBoxSettingsOpen', true)
  }

  openSettings = ev => {
    const { card, uiStore } = this.props
    uiStore.setEditingCardCover(card.id)
  }

  printPage = ev => {
    ev.preventDefault()
    window.print()
  }

  selectCardsBelow = () => {
    const { apiStore, uiStore, card } = this.props
    uiStore.selectCardId(card.id)
    const selectedCards = _.map(uiStore.selectedCardIds, id =>
      apiStore.find('collection_cards', id)
    )
    // TODO: this could be made slightly more efficient, if we know that some of these cards
    // have nothing below (by what is loaded in memory), we could skip API calls for those
    const bottomCards = _.uniq([card, ...findBottomRowCards(selectedCards)])
    uiStore.closeCardMenu()
    _.each(bottomCards, card => card.API_selectCardIdsBelow())
  }

  get movingFromCollectionId() {
    const { card, uiStore, location } = this.props
    // For PageMenu we're moving "from" the parent collection
    // Viewing collection could also be null if on the search page
    if (location === 'PageMenu' || !uiStore.viewingCollection) {
      return card.parent_id
    }
    return uiStore.viewingCollection.id
  }

  addComment = async () => {
    const { apiStore, uiStore, card } = this.props
    const { record } = card

    apiStore.openCurrentThreadToCommentOn(record)
    uiStore.closeCardMenu()
  }

  get menuItems() {
    const {
      canView,
      canEdit,
      card,
      canReplace,
      submissionBox,
      location,
      testCollectionCard,
    } = this.props
    const { record } = card
    const { viewingCollection } = this

    const actions = [
      {
        name: 'Comment',
        iconRight: <CommentIcon />,
        onClick: this.addComment,
      },
      {
        name: 'Duplicate',
        iconRight: <DuplicateIcon />,
        onClick: this.duplicateCard,
      },
      { name: 'Move', iconRight: <MoveIcon />, onClick: this.moveCard },
      { name: 'Link', iconRight: <LinkIcon />, onClick: this.linkCard },
      {
        name: 'Select All',
        iconRight: <SelectAllIcon />,
        onClick: this.selectAll,
      },
      {
        name: 'Add to My Collection',
        iconRight: <AddIntoIcon />,
        onClick: this.addToMyCollection,
      },
      {
        name: 'Download',
        iconRight: <DownloadIcon />,
        onClick: this.downloadCard,
      },
      { name: 'Tags', iconRight: <TagIcon />, onClick: this.showTags },
      {
        name: 'Sharing',
        iconRight: <SharingIcon />,
        onClick: this.showRolesMenu,
      },
      {
        name: 'Replace',
        iconRight: <ReplaceIcon />,
        onClick: this.replaceCard,
      },
      {
        name: 'Delete',
        iconRight: <TrashIconXl />,
        onClick: this.archiveCard,
      },
    ]
    actions.forEach(actionItem => {
      if (actionItem.name === this.itemLoading) {
        actionItem.loading = true
      }
      const originOnClick = actionItem.onClick
      actionItem.onClick = () => {
        this.closeCardMenu()
        originOnClick()
      }
    })
    let items = [...actions]

    if (submissionBox) {
      items.unshift({
        name: 'Sub. Box Settings',
        iconRight: <SubmissionBoxIcon size="sm" />,
        onClick: this.openSubmissionBoxSettings,
      })
    }
    if (canEdit && !card.isPinnedAndLocked) {
      // Replace action is added later if this.props.canReplace
      items = _.reject(items, { name: 'Replace' })
      if (
        record &&
        (record.is_submission_box_template || location === 'Search')
      ) {
        items = _.reject(items, { name: 'Delete' })
        items = _.reject(items, { name: 'Move' })
      }
    } else {
      const viewActions = [
        'Comment',
        'Link',
        'Select All',
        'Add to My Collection',
        'Download',
      ]
      if (canView) {
        viewActions.unshift('Duplicate')
      }
      if (location !== 'Search' && !record.isCommonViewable) {
        viewActions.push('Tags')
        viewActions.push('Sharing')
      }
      items = _.filter(items, a => _.includes(viewActions, a.name))
    }

    if (location === 'Search') {
      // Select All doesn't work from the search page
      items = _.reject(items, { name: 'Select All' })
    }

    if (location === 'PageMenu' && record.isCollection) {
      if (canEdit) {
        items.push({
          name: 'Settings',
          iconRight: <SettingsIcon />,
          onClick: this.openSettings,
        })
      }
      items.push({
        name: 'Print',
        iconRight: <PrintIcon />,
        onClick: this.printPage,
      })
    }

    // if record is system required, we always remove these actions
    if (record && record.system_required) {
      items = _.reject(items, { name: 'Duplicate' })
      items = _.reject(items, { name: 'Tags' })
      if (!card.link) {
        items = _.reject(items, { name: 'Delete' })
      }
    }

    if (viewingCollection) {
      // Remove Add To My Collection menu item for special collections
      if (viewingCollection.isUserCollection) {
        items = _.reject(items, { name: 'Add to My Collection' })
      }
      if (viewingCollection.isSearchCollection) {
        items = _.reject(items, { name: 'Move' })
      }
      if (
        viewingCollection.isBoard &&
        viewingCollection.viewMode !== 'list' &&
        location === 'GridCard'
      ) {
        const selectAllIndex = _.findIndex(items, { name: 'Select All' })
        const selectCardsBelow = {
          name: 'Select Cards Below',
          iconRight: <SelectAllIcon />,
          onClick: this.selectCardsBelow,
        }
        items = [
          ...items.slice(0, selectAllIndex + 1),
          selectCardsBelow,
          ...items.slice(selectAllIndex + 1),
        ]
      }
    }

    if (!record || !record.isDownloadable) {
      items = _.reject(items, { name: 'Download' })
    }

    if (canReplace) {
      items.push(_.find(actions, { name: 'Replace' }))
    }

    // last special case for test collection card
    if (testCollectionCard) {
      return _.filter(actions, { name: 'Replace' })
    }

    const { menuItemsCount } = this.props
    if (menuItemsCount) {
      menuItemsCount(items.length)
    }

    if (record && record.archived) {
      // Turn off most actions if looking at archived record
      items = _.reject(items, { name: 'Duplicate' })
      items = _.reject(items, { name: 'Move' })
      items = _.reject(items, { name: 'Link' })
      items = _.reject(items, { name: 'Replace' })
      items = _.reject(items, { name: 'Delete' })
      items = _.reject(items, { name: 'Sub. Box Settings' })
      items = _.reject(items, { name: 'Add to My Collection' })
      items = _.reject(items, { name: 'Sharing' })
    }

    return items
  }

  get buttonStyle() {
    const { location } = this.props
    return location === 'GridCard' || location === 'Search' ? 'card' : ''
  }

  get offsetPosition() {
    const { uiStore, offsetPosition, card, location, zoomLevel } = this.props
    const clickedOnGridCardDotMenu =
      location && (location === 'GridCard' || location === 'Search')
    const shouldOverrideFixedPosition = card && card.col === 0 && zoomLevel >= 2

    if (clickedOnGridCardDotMenu && shouldOverrideFixedPosition) {
      return {
        x: 0,
        y: 22,
      }
    }

    return (
      offsetPosition || {
        x: uiStore.cardMenuOpen.offsetX,
        y: uiStore.cardMenuOpen.offsetY,
      }
    )
  }

  render() {
    const { className, menuOpen, wrapperClassName, location } = this.props

    return (
      <PopoutMenu
        className={className}
        wrapperClassName={wrapperClassName}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.toggleOpen}
        menuItems={this.menuItems}
        menuOpen={menuOpen}
        buttonStyle={this.buttonStyle}
        width={250}
        location={location}
        positionRelative={false}
        shouldOverrideFixedPosition
      />
    )
  }
}

ActionMenu.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  location: PropTypes.string.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  canView: PropTypes.bool,
  canEdit: PropTypes.bool.isRequired,
  canReplace: PropTypes.bool,
  submissionBox: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  onMoveMenu: PropTypes.func,
  afterArchive: PropTypes.func,
  testCollectionCard: PropTypes.bool,
  menuItemsCount: PropTypes.func,
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  zoomLevel: PropTypes.number,
}
ActionMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
ActionMenu.displayName = 'ActionMenu'

ActionMenu.defaultProps = {
  className: '',
  wrapperClassName: 'card-menu',
  onMoveMenu: null,
  afterArchive: null,
  canView: true,
  canReplace: false,
  submissionBox: false,
  testCollectionCard: false,
  menuItemsCount: null,
  offsetPosition: null,
  zoomLevel: null,
}

export default ActionMenu
