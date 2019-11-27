import _ from 'lodash'
import { Fragment } from 'react'
import pluralize from 'pluralize'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { animateScroll as scroll } from 'react-scroll'

import ClickWrapper from '~/ui/layout/ClickWrapper'
import ChannelManager from '~/utils/ChannelManager'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import CollectionFilter from '~/ui/filtering/CollectionFilter'
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
import ArchivedBanner from '~/ui/layout/ArchivedBanner'
import OverdueBanner from '~/ui/layout/OverdueBanner'
import routeToLogin from '~/utils/routeToLogin'
import CreateOrgPage from '~/ui/pages/CreateOrgPage'
import { Helmet } from 'react-helmet'

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
    const { collection, apiStore } = this.props
    if (!apiStore.currentUser && !collection.anyone_can_view) {
      // in this case, if you're not logged in but you had access (joinable but not public)
      // we do require you to login
      // NOTE: the user will see a brief flash of the collection name before redirect
      routeToLogin({ redirect: collection.frontend_url })
    }
    this.setViewingRecordAndRestoreScrollPosition()
    this.loadCollectionCards({})
  }

  componentDidUpdate(prevProps) {
    const { collection, routingStore } = this.props
    const previousId = prevProps.collection.id
    const currentId = collection.id
    if (currentId !== previousId) {
      runInAction(() => {
        this.cardsFetched = false
      })
      ChannelManager.unsubscribeAllFromChannel(this.channelName)
      // when navigating between collections, close BCT
      this.props.uiStore.closeBlankContentTool()
      this.setViewingRecordAndRestoreScrollPosition()
      this.loadCollectionCards({})
      routingStore.updateScrollState(previousId, window.pageYOffset)
    }
  }

  componentWillUnmount() {
    const { routingStore, collection } = this.props
    ChannelManager.unsubscribeAllFromChannel(this.channelName)
    routingStore.updateScrollState(collection.id, window.pageYOffset)
  }

  get collection() {
    // TODO: replace all references to this.collection with this.props.collection
    return this.props.collection
  }

  setViewingRecordAndRestoreScrollPosition() {
    const { collection, uiStore } = this.props
    // setViewingRecord has to happen first bc we use it in openBlankContentTool
    uiStore.setViewingRecord(collection)
    this.restoreWindowScrollPosition()
  }

  loadCollectionCards = async ({ page, per_page, rows, cols }) => {
    const { collection } = this.props
    // if the collection is still awaiting updates, there are no cards to load
    if (collection.awaiting_updates) {
      this.pollForUpdates()
      return
    }

    let params
    if (collection.isRegularCollection) {
      params = { page, per_page, rows, cols }
    } else {
      params = { rows }
    }

    return collection.API_fetchCards(params).then(() => {
      runInAction(() => {
        this.cardsFetched = true
        this.onAPILoad()
      })
    })
  }

  loadSubmissionsCollectionCards = async ({ page, per_page, rows, cols }) => {
    const { collection } = this.props
    return collection.submissions_collection.API_fetchCards({
      page,
      per_page,
      rows,
      cols,
    })
  }

  async onAPILoad() {
    const {
      collection,
      apiStore,
      uiStore,
      routingStore,
      undoStore,
    } = this.props

    apiStore.checkCurrentOrg({ id: collection.organization_id })

    this.subscribeToChannel(collection.id)

    if (collection.isSubmissionsCollection) {
      // NOTE: SubmissionsCollections are not meant to be viewable, so we route
      // back to the SubmissionBox instead
      routingStore.routeTo('collections', collection.submission_box_id)
      return
    }
    if (uiStore.actionAfterRoute) {
      uiStore.performActionAfterRoute()
    }
    if (collection.collection_cards.length === 0) {
      uiStore.openBlankContentTool()
    }
    if (undoStore.undoAfterRoute) {
      undoStore.performUndoAfterRoute()
    }
    if (collection.joinable_group_id) {
      apiStore.checkJoinableGroup(collection.joinable_group_id)
    }
    if (collection.isNormalCollection) {
      if (apiStore.currentUser) {
        const thread = await apiStore.findOrBuildCommentThread(collection)
        uiStore.expandThread(thread.key)
      }
      this.checkSubmissionBox()
    } else {
      apiStore.clearUnpersistedThreads()
    }
    if (apiStore.currentUser && routingStore.query) {
      // This must run after findOrBuildCommentThread,
      // as it needs that if displaying in-collection test
      uiStore.openOptionalMenus(routingStore.query)
    }
    if (collection.processing_status) {
      const message = `${collection.processing_status}...`
      uiStore.popupSnackbar({ message })
    }
    uiStore.update('dragTargets', [])
  }

  restoreWindowScrollPosition() {
    const { collection, uiStore, routingStore } = this.props
    const { previousViewingRecord } = uiStore
    const linkedBreadCrumbTrail = previousViewingRecord
      ? uiStore.linkedBreadcrumbTrailForRecord(previousViewingRecord)
      : []
    let isComingFromViewingRecordBreadcrumb = _.find(linkedBreadCrumbTrail, {
      id: collection.id,
    })
    if (
      collection.isUserCollection &&
      previousViewingRecord &&
      previousViewingRecord.inMyCollection
    ) {
      // we went from a record in my collection -> My Collection
      isComingFromViewingRecordBreadcrumb = true
    }
    const {
      toPathScrollY,
      history,
      location,
      previousPageBeforeSearch,
    } = routingStore
    const { action } = history
    const originalScrollY = toPathScrollY(collection.id)
    const returningFromSearch = previousPageBeforeSearch === location.pathname
    routingStore.previousPageBeforeSearch = null // reset previous page back to original state
    // on browser back button click, breadcrumb, or cancel search, scroll to original position
    const shouldScrollToOriginalPosition =
      action === 'POP' ||
      isComingFromViewingRecordBreadcrumb ||
      returningFromSearch

    if (shouldScrollToOriginalPosition) {
      scroll.scrollTo(originalScrollY, { duration: 200 })
    } else {
      scroll.scrollToTop({ duration: 0 })
    }
  }

  pollForUpdates() {
    const { collection, apiStore, uiStore } = this.props
    if (uiStore.dialogConfig.open !== 'loading') {
      let prompt =
        'Please wait while we build your account. This should take from 15 to 30 seconds.'
      if (collection.isTestCollectionOrResults) {
        prompt =
          'Please wait while we generate your feedback results collection. This should take 5 to 10 seconds.'
      }
      uiStore.loadingDialog({
        prompt,
        iconName: 'Celebrate',
      })
    }

    this.updatePoller = setInterval(async () => {
      if (collection.awaiting_updates) {
        const res = await apiStore.fetch('collections', collection.id, true)
        if (!res.data.awaiting_updates) {
          this.loadCollectionCards({})
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
        if (item && item.quill_data) {
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
      localItem.quill_data = item.quill_data
    } else {
      // we don't have the item, it must be a new card that we need to fetch
      this.reloadData()
    }
    this.setEditor(current_editor)
  }

  async _reloadData() {
    const { collection } = this.props
    const per_page =
      collection.collection_cards.length || collection.recordsPerPage
    if (collection.isBoard) {
      this.loadCollectionCards({ rows: [0, collection.loadedRows] })
    } else {
      this.loadCollectionCards({ per_page })
    }
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

  trackCollectionUpdated = () => {
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
    // don't let logged-out users see who's editing, but they can still receive realtime updates
    if (!currentUserId) return
    if (_.isEmpty(currentEditor) || currentEditor.id === currentUserId)
      hidden = 'hidden'
    return (
      <EditorPill className={`editor-pill ${hidden}`} editor={currentEditor} />
    )
  }

  renderSubmissionsCollection() {
    const { collection, uiStore } = this.props
    const { blankContentToolState, gridSettings, loadedSubmissions } = uiStore
    const {
      submissionTypeName,
      submissions_collection,
      submission_box_type,
      submission_template,
      submissions_enabled,
    } = collection

    if (!submissions_collection || !loadedSubmissions) {
      return this.loader()
    }

    return (
      <div style={{ position: 'relative' }}>
        {this.submissionsPageSeparator}
        <CollectionFilter
          collection={submissions_collection}
          canEdit={collection.can_edit_content}
          sortable
        />
        <CollectionGrid
          {...gridSettings}
          loadCollectionCards={this.loadSubmissionsCollectionCards}
          trackCollectionUpdated={this.trackCollectionUpdated}
          collection={submissions_collection}
          canEditCollection={false}
          // Pass in cardProperties so grid will re-render when they change
          cardProperties={submissions_collection.cardProperties}
          // Pass in BCT state so grid will re-render when open/closed
          blankContentToolState={blankContentToolState}
          submissionSettings={{
            type: submission_box_type,
            template: submission_template,
            enabled: submissions_enabled,
          }}
          movingCardIds={[]}
          sorting
        />
        {submissions_enabled && (
          <FloatingActionButton
            toolTip={`Add ${submissionTypeName}`}
            onClick={this.onAddSubmission}
            icon={<PlusIcon />}
          />
        )}
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
        zIndex: v.zIndex.clickWrapper,
        marginTop: v.headerHeight + 40,
        position: 'fixed',
        top: 0,
        left: 'calc(50% - 50px)',
      }}
    >
      <Loader />
    </div>
  )

  render() {
    const { collection, uiStore, apiStore } = this.props

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
      selectedArea,
      cardMenuOpen,
    } = uiStore

    // props shared by Foamcore + Normal
    const genericCollectionProps = {
      collection,
      loadCollectionCards: this.loadCollectionCards,
      trackCollectionUpdated: this.trackCollectionUpdated,
      canEditCollection: collection.can_edit_content,
      // Pass in cardProperties so grid will re-render when they change
      cardProperties: collection.cardProperties,
      // Pass in BCT state so grid will re-render when open/closed
      blankContentToolState,
      // to trigger a re-render
      movingCardIds: [...uiStore.movingCardIds],
      isMovingCards: uiStore.isMovingCards,
    }

    // submissions_collection will only exist for submission boxes
    const { isSubmissionBox, isTestCollection } = collection
    const userRequiresOrg =
      !apiStore.currentUserOrganization && collection.common_viewable

    let inner
    if (collection.isBoard) {
      inner = (
        <FoamcoreGrid
          {...genericCollectionProps}
          selectedArea={selectedArea}
          // Included so that component re-renders when area changes
          selectedAreaMinX={selectedArea.minX}
          // Trigger re-render if card menu is opened
          cardIdMenuOpen={cardMenuOpen.id}
        />
      )
    } else if (isTestCollection) {
      inner = this.renderTestDesigner()
    } else {
      inner = (
        <CollectionGrid
          {...genericCollectionProps}
          // pull in cols, gridW, gridH, gutter
          {...gridSettings}
          // don't add the extra row for submission box
          shouldAddEmptyRow={!isSubmissionBox}
          cardsFetched={this.cardsFetched}
        />
      )
    }

    return (
      <Fragment>
        <Helmet title={collection.pageTitle} />
        <PageHeader record={collection} />
        {userRequiresOrg && (
          // for new user's trying to add a common resource, they'll see the Create Org modal
          // pop up over the CollectionGrid
          <CreateOrgPage commonViewableResource={collection} />
        )}
        {!isLoading && (
          <Fragment>
            <ArchivedBanner />
            <OverdueBanner />
            <PageContainer fullWidth={collection.isBoard}>
              {this.renderEditorPill}
              {inner}
              {(collection.requiresSubmissionBoxSettings ||
                submissionBoxSettingsOpen) && (
                <SubmissionBoxSettingsModal collection={collection} />
              )}
              {/* Listen to this pastingCards value which comes from pressing CTRL+V */}
              <MoveModal pastingCards={uiStore.pastingCards} />
              {isSubmissionBox &&
                apiStore.currentUser &&
                collection.submission_box_type &&
                this.renderSubmissionsCollection()}
              {(uiStore.dragging || uiStore.cardMenuOpenAndPositioned) && (
                <ClickWrapper
                  clickHandlers={[this.handleAllClick]}
                  onContextMenu={this.handleAllClick}
                />
              )}
            </PageContainer>
          </Fragment>
        )}
        {isLoading && this.loader()}
        {!isLoading && isTransparentLoading && this.transparentLoader()}
      </Fragment>
    )
  }
}

CollectionPage.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  undoStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionPage
