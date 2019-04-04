import PropTypes from 'prop-types'
import _ from 'lodash'
import { Fragment } from 'react'
import pluralize from 'pluralize'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import ClickWrapper from '~/ui/layout/ClickWrapper'
import ChannelManager from '~/utils/ChannelManager'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import FloatingActionButton from '~/ui/global/FloatingActionButton'
import Loader from '~/ui/layout/Loader'
import MoveModal from '~/ui/grid/MoveModal'
import PageContainer from '~/ui/layout/PageContainer'
import PageHeader from '~/ui/pages/shared/PageHeader'
import PageSeparator from '~/ui/global/PageSeparator'
import PlusIcon from '~/ui/icons/PlusIcon'
import SubmissionBoxSettingsModal from '~/ui/submission_box/SubmissionBoxSettingsModal'
import EditorPill from '~/ui/items/EditorPill'
import TestDesigner from '~/ui/test_collections/TestDesigner'
import v from '~/utils/variables'
import Collection from '~/stores/jsonApi/Collection'
import OverdueBanner from '~/ui/layout/OverdueBanner'

// more global way to do this?
pluralize.addPluralRule(/canvas$/i, 'canvases')

@inject('apiStore', 'uiStore', 'routingStore', 'undoStore')
@observer
class CollectionPage extends React.Component {
  @observable
  currentEditor = {}
  @observable
  cardsFetched = false

  updatePoller = null
  editorTimeout = null
  channelName = 'CollectionViewingChannel'

  constructor(props) {
    super(props)
    this.reloadData = _.debounce(this._reloadData, 1500)
  }

  componentDidMount() {
    this.onAPILoad()
    window.addEventListener('click', this.deselectAllCards)
  }

  componentDidUpdate(prevProps) {
    const { collection } = this.props
    const previousId = prevProps.collection.id
    const currentId = collection.id
    if (currentId !== previousId) {
      runInAction(() => {
        this.cardsFetched = false
      })
      scroll.scrollToTop({ duration: 0 })
      ChannelManager.unsubscribeAllFromChannel(this.channelName)
      // when navigating between collections, close BCT
      this.props.uiStore.closeBlankContentTool()
      this.onAPILoad()
    }
  }

  componentWillUnmount() {
    // super.componentWillUnmount()
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
    window.removeEventListener('click', this.deselectAllCards)
  }

  get collection() {
    // TODO: replace all references to this.collection with this.props.collection
    return this.props.collection
  }

  async onAPILoad() {
    const {
      collection,
      apiStore,
      uiStore,
      routingStore,
      undoStore,
    } = this.props
    this.subscribeToChannel(collection.id)
    // do this here, asynchronously -- don't need to await to perform other actions
    collection.API_fetchCards().then(() => {
      runInAction(() => {
        this.cardsFetched = true
      })
      if (collection.collection_cards.length === 0) {
        uiStore.openBlankContentTool()
      }
      if (undoStore.undoAfterRoute) {
        undoStore.performUndoAfterRoute()
      }
      if (uiStore.actionAfterRoute) {
        uiStore.performActionAfterRoute()
      }
      if (collection.awaiting_updates) {
        this.pollForUpdates()
      }
    })

    // setViewingCollection has to happen first bc we use it in openBlankContentTool
    uiStore.setViewingCollection(collection)
    if (collection.isSubmissionsCollection) {
      // NOTE: SubmissionsCollections are not meant to be viewable, so we route
      // back to the SubmissionBox instead
      routingStore.routeTo('collections', collection.submission_box_id)
      return
    }
    collection.checkCurrentOrg()
    if (collection.isNormalCollection) {
      const thread = await apiStore.findOrBuildCommentThread(collection)
      uiStore.expandThread(thread.key)
      if (routingStore.query) {
        uiStore.openOptionalMenus(routingStore.query)
      }
      this.checkSubmissionBox()
    } else {
      apiStore.clearUnpersistedThreads()
    }
    if (collection.processing_status) {
      const message = `${collection.processing_status}...`
      uiStore.popupSnackbar({ message })
    }

    uiStore.update('dragTargets', [])
  }

  pollForUpdates() {
    const { collection, apiStore, uiStore } = this.props
    this.updatePoller = setInterval(async () => {
      if (collection.awaiting_updates) {
        const res = await apiStore.fetch('collections', collection.id, true)
        if (!res.data.awaiting_updates) {
          collection.API_fetchCards()
        } else if (uiStore.dialogConfig.open !== 'loading') {
          uiStore.loadingDialog({
            prompt:
              'Please wait while we build your account. This should take from 15 to 30 seconds.',
            iconName: 'Celebrate',
          })
        }
      } else {
        clearInterval(this.updatePoller)
        uiStore.closeDialog()
      }
    }, 2000)
  }

  async checkSubmissionBox() {
    const { collection, uiStore } = this.props
    if (collection.isSubmissionBox && collection.submissions_collection_id) {
      this.setLoadedSubmissions(false)
      // NOTE: if other collections get sortable features we may move this logic
      uiStore.update('collectionCardSortOrder', 'updated_at')
      await Collection.fetchSubmissionsCollection(
        collection.submissions_collection_id,
        { order: 'updated_at' }
      )
      this.setLoadedSubmissions(true)
      // Also subscribe to updates for the submission boxes
      this.subscribeToChannel(collection.submissions_collection_id)
    }
  }

  subscribeToChannel(id) {
    ChannelManager.subscribe(this.channelName, id, {
      channelReceivedData: this.receivedChannelData,
    })
  }

  @action
  setEditor = editor => {
    this.currentEditor = editor
    if (this.editorTimeout) clearTimeout(this.editorTimeout)
    // this.unmounted comes from PageWithApi
    if (this.unmounted || _.isEmpty(editor)) return
    this.editorTimeout = setTimeout(() => this.setEditor({}), 4000)
  }

  handleAllClick = ev => {
    const { uiStore } = this.props
    ev.preventDefault()
    uiStore.closeCardMenu()
  }

  deselectAllCards = (event) => {
    const { uiStore } = this.props
    console.log(event.target)
    const target = event.target
    const tagName = target.tagName

    // check if parent is a button
    if (tagName === 'SVG') {

      while (true) {}
    }

    const ALLOWED_ELEMENTS = ['BUTTON', 'A']
    if (ALLOWED_ELEMENTS.some((el) => el === tagName)){
      console.log(`exiting because ${el} is an allowed element`)
      return
    }
    const role = target.getAttribute('role')
    if (role && role === 'button') {
      console.log("clicking a button, no deselecting to do")
      return
    }

    uiStore.deselectCards()
  }

  receivedChannelData = async data => {
    const { collection, apiStore } = this.props
    // catch if receivedData happens after reload
    if (!collection) return
    const currentId = collection.id
    const submissions = collection.submissions_collection
    const submissionsId = submissions ? submissions.id : ''

    if (_.compact([currentId, submissionsId]).indexOf(data.record_id) > -1) {
      if (
        !_.isEmpty(data.current_editor) &&
        data.current_editor.id === apiStore.currentUserId
      ) {
        // don't reload your own updates
        return
      }
      if (data.data && data.data.item) {
        const { item } = data.data
        if (item && item.data_content) {
          this.handleTextItemUpdate(item, data.current_editor)
          return
        }
      }
      this.setEditor(data.current_editor)
      this.reloadData()
    }
  }

  handleTextItemUpdate = (item, current_editor) => {
    const { apiStore, uiStore } = this.props
    const localItem = apiStore.find('items', item.id)
    if (localItem) {
      // update with incoming content UNLESS we are editing that item
      if (
        uiStore.textEditingItem &&
        uiStore.textEditingItem.id === localItem.id
      ) {
        return
      }
      localItem.data_content = item.data_content
    } else {
      // we don't have the item, it must be a new card that we need to fetch
      this.reloadData()
    }
    this.setEditor(current_editor)
  }

  async _reloadData() {
    const { collection } = this.props
    const per_page = collection.collection_cards.length || 50
    collection.API_fetchCards({ per_page })
    if (this.collection.submissions_collection) {
      this.setLoadedSubmissions(false)
      await this.collection.submissions_collection.API_fetchCards()
      this.setLoadedSubmissions(true)
    }
  }

  @action
  setLoadedSubmissions = val => {
    const { uiStore } = this.props

    if (!this.collection) return
    const { submissions_collection } = this.collection
    if (submissions_collection && submissions_collection.cardIds.length) {
      // if submissions_collection is preloaded with some cards, no need to show loader
      uiStore.update('loadedSubmissions', true)
      return
    }
    uiStore.update('loadedSubmissions', val)
  }

  onAddSubmission = ev => {
    ev.preventDefault()
    const { id } = this.collection.submissions_collection
    const submissionSettings = {
      type: this.collection.submission_box_type,
      template: this.collection.submission_template,
    }
    Collection.createSubmission(id, submissionSettings)
  }

  updateCollection = ({ card, updates, undoMessage } = {}) => {
    const { collection } = this.props
    // this will assign the update attrs to the card and push an undo action
    collection.API_updateCards({ card, updates, undoMessage })
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  batchUpdateCollection = ({ cards, updates, undoMessage } = {}) => {
    const { collection } = this.props
    // this will assign the update attrs to the card and push an undo action
    collection.API_batchUpdateCards({ cards, updates, undoMessage })
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  get submissionsPageSeparator() {
    const { collection } = this.props
    const { submissionTypeName, submissions_collection } = collection
    if (!submissions_collection) return ''
    return (
      <PageSeparator
        title={
          <h3>
            {submissions_collection.collection_cards.length}{' '}
            {submissions_collection.collection_cards.length === 1
              ? submissionTypeName
              : pluralize(submissionTypeName)}
          </h3>
        }
      />
    )
  }

  get renderEditorPill() {
    const { currentEditor } = this
    const { currentUserId } = this.props.apiStore
    let hidden = ''
    if (_.isEmpty(currentEditor) || currentEditor.id === currentUserId)
      hidden = 'hidden'
    return (
      <EditorPill className={`editor-pill ${hidden}`} editor={currentEditor} />
    )
  }

  renderSubmissionsCollection() {
    const { collection, uiStore } = this.props
    const { blankContentToolState, gridSettings, loadedSubmissions } = uiStore
    const { submissionTypeName, submissions_collection } = collection

    if (!submissions_collection || !loadedSubmissions) {
      return this.loader()
    }

    return (
      <div>
        {this.submissionsPageSeparator}
        <CollectionGrid
          {...gridSettings}
          updateCollection={this.updateCollection}
          batchUpdateCollection={this.batchUpdateCollection}
          collection={submissions_collection}
          canEditCollection={false}
          // Pass in cardProperties so grid will re-render when they change
          cardProperties={submissions_collection.cardProperties}
          // Pass in BCT state so grid will re-render when open/closed
          blankContentToolState={blankContentToolState}
          submissionSettings={{
            type: collection.submission_box_type,
            template: collection.submission_template,
          }}
          movingCardIds={[]}
          sorting
        />
        <FloatingActionButton
          toolTip={`Add ${submissionTypeName}`}
          onClick={this.onAddSubmission}
          icon={<PlusIcon />}
        />
      </div>
    )
  }

  renderTestDesigner() {
    return <TestDesigner collection={this.collection} />
  }

  loader = () => (
    <div style={{ marginTop: v.headerHeight }}>
      <Loader />
    </div>
  )

  transparentLoader = () => (
    <div
      style={{
        marginTop: v.headerHeight,
        position: 'fixed',
        top: 0,
        left: 'calc(50% - 50px)',
      }}
    >
      <Loader />
    </div>
  )

  render() {
    const { collection, isHomepage, uiStore } = this.props
    if (!collection) {
      return this.loader()
    }

    // NOTE: if we have first loaded the slimmer SerializableSimpleCollection via the CommentThread
    // then some fields like `can_edit` will be undefined.
    // So we check if the full Collection has loaded via the `can_edit` attr
    // Also, checking meta.snapshot seems to load more consistently than just collection.can_edit
    const isLoading =
      collection.meta.snapshot.can_edit === undefined ||
      (!this.cardsFetched && collection.collection_cards.length === 0) ||
      collection.awaiting_updates ||
      uiStore.isLoading
    const isTransparentLoading = !!uiStore.movingIntoCollection

    const {
      blankContentToolState,
      submissionBoxSettingsOpen,
      gridSettings,
    } = uiStore

    // submissions_collection will only exist for submission boxes
    const { isSubmissionBox, requiresTestDesigner } = collection
    if (collection.isBoard) {
      return (
        <Fragment>
          <PageHeader record={collection} isHomepage={isHomepage} />
          <PageContainer fullWidth={collection.isBoard}>
            <FoamcoreGrid
              // pull in cols, gridW, gridH, gutter
              {...gridSettings}
              updateCollection={this.updateCollection}
              batchUpdateCollection={this.batchUpdateCollection}
              collection={collection}
              canEditCollection={collection.can_edit_content}
              // Pass in cardProperties so grid will re-render when they change
              cardProperties={collection.cardProperties}
              // to trigger a re-render
              movingCardIds={uiStore.movingCardIds}
            />
            <MoveModal />
            {(uiStore.dragging || uiStore.cardMenuOpenAndPositioned) && (
              <ClickWrapper
                clickHandlers={[this.handleAllClick]}
                onContextMenu={this.handleAllClick}
              />
            )}
          </PageContainer>
          {isLoading && this.loader()}
          {!isLoading && isTransparentLoading && this.transparentLoader()}
        </Fragment>
      )
    }
    return (
      <Fragment>
        <PageHeader record={collection} isHomepage={isHomepage} />
        {!isLoading && (
          <PageContainer>
            <OverdueBanner />
            {this.renderEditorPill}
            {requiresTestDesigner && this.renderTestDesigner()}
            {!requiresTestDesigner && (
              <CollectionGrid
                // pull in cols, gridW, gridH, gutter
                {...gridSettings}
                updateCollection={this.updateCollection}
                batchUpdateCollection={this.batchUpdateCollection}
                collection={collection}
                canEditCollection={collection.can_edit_content}
                // Pass in cardProperties so grid will re-render when they change
                cardProperties={collection.cardProperties}
                // Pass in BCT state so grid will re-render when open/closed
                blankContentToolState={blankContentToolState}
                // to trigger a re-render
                movingCardIds={
                  uiStore.isMovingCards ? [...uiStore.movingCardIds] : []
                }
                // don't add the extra row for submission box
                addEmptyCard={!isSubmissionBox}
              />
            )}
            {(collection.requiresSubmissionBoxSettings ||
              submissionBoxSettingsOpen) && (
              <SubmissionBoxSettingsModal collection={collection} />
            )}
            <MoveModal />
            {isSubmissionBox &&
              collection.submission_box_type &&
              this.renderSubmissionsCollection()}
            {(uiStore.dragging || uiStore.cardMenuOpenAndPositioned) && (
              <ClickWrapper
                clickHandlers={[this.handleAllClick]}
                onContextMenu={this.handleAllClick}
              />
            )}
          </PageContainer>
        )}
        {isLoading && this.loader()}
        {!isLoading && isTransparentLoading && this.transparentLoader()}
      </Fragment>
    )
  }
}

CollectionPage.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool,
}
CollectionPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  undoStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionPage.defaultProps = {
  isHomepage: false,
}

export default CollectionPage
