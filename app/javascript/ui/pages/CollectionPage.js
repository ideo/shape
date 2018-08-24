import { Fragment } from 'react'
import pluralize from 'pluralize'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import PageError from '~/ui/global/PageError'
import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import PageContainer from '~/ui/layout/PageContainer'
import PageSeparator from '~/ui/global/PageSeparator'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import MoveModal from '~/ui/grid/MoveModal'
import PageHeader from '~/ui/pages/shared/PageHeader'
import SubmissionBoxSettingsModal from '~/ui/submission_box/SubmissionBoxSettingsModal'

const isHomepage = ({ params }) => (params.org && !params.id)

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class CollectionPage extends PageWithApi {
  @observable loadingSubmissions = false

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    // when navigating between collections, close BCT
    if (nextProps.match.params.id !== this.props.match.params.id) {
      this.props.uiStore.closeBlankContentTool()
    }
  }

  @action setLoadingSubmissions = val => {
    const { submissions_collection } = this.collection
    if (submissions_collection && submissions_collection.cardIds.length) {
      // if submissions_collection is preloaded with some cards, no need to show loader
      this.loadingSubmissions = false
      return
    }
    this.loadingSubmissions = val
  }

  get isHomepage() {
    return isHomepage(this.props.match)
  }

  get collection() {
    const { match, apiStore } = this.props
    if (!apiStore.collections.length) return null
    if (this.isHomepage) {
      return apiStore.find('collections', apiStore.currentUser.current_user_collection_id)
    }
    return apiStore.find('collections', match.params.id)
  }

  get roles() {
    const { apiStore, match } = this.props
    return apiStore.findAll('roles').filter((role) =>
      role.resource && role.resource.id === parseInt(match.params.id))
  }

  requestPath = (props) => {
    const { match, apiStore } = props
    if (isHomepage(match)) {
      return `collections/${apiStore.currentUser.current_user_collection_id}`
    }
    return `collections/${match.params.id}`
  }

  onAPILoad = async (response) => {
    this.updateError(null)
    const collection = response.data
    const { apiStore, uiStore, location } = this.props
    uiStore.setViewingCollection(collection)
    // setViewingCollection has to happen first bc we use it in openBlankContentTool
    if (!collection.collection_cards.length) {
      uiStore.openBlankContentTool()
    }
    collection.checkCurrentOrg()
    if (collection.isNormalCollection) {
      const thread = await apiStore.findOrBuildCommentThread(collection)
      if (location.search) {
        const menu = uiStore.openOptionalMenus(location.search)
        if (menu === 'comments') {
          uiStore.expandThread(thread.key)
        }
      }
      if (collection.isSubmissionBox && collection.submissions_collection) {
        this.setLoadingSubmissions(true)
        await apiStore.fetch('collections', collection.submissions_collection.id, true)
        this.setLoadingSubmissions(false)
      }
    } else {
      apiStore.clearUnpersistedThreads()
    }
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection.API_updateCards()
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  updateCollectionName = (name) => {
    this.collection.name = name
    this.collection.save()
    const { uiStore } = this.props
    uiStore.trackEvent('update', this.collection)
  }

  get submissionsPageSeparator() {
    const { collection } = this
    const { submissionTypeName } = collection
    return (
      <PageSeparator title={(
        <h3>
          {collection.submissions_collection.collection_cards.length}
          {' '}
          {collection.submissions_collection.collection_cards.length === 1
            ? submissionTypeName
            : pluralize(submissionTypeName)
          }
        </h3>
      )}
      />
    )
  }

  render() {
    // this.error comes from PageWithApi
    if (this.error) return <PageError error={this.error} />
    const { collection } = this
    // for some reason collection can come through as an object, but not some fields like can_edit,
    // which indicates it hasn't finished loading everything
    if (!collection || collection.can_edit === undefined) return <Loader />

    const { uiStore } = this.props
    // submissions_collection will only exist for submission boxes
    const { submissions_collection } = collection
    const {
      blankContentToolState,
      submissionBoxSettingsOpen,
      gridSettings,
    } = uiStore
    const { movingCardIds, cardAction } = uiStore
    // only tell the Grid to hide "movingCards" if we're moving and not linking
    const uiMovingCardIds = cardAction === 'move' ? movingCardIds : []
    // SharedCollection has special behavior where it sorts by most recently updated
    const sortBy = collection.isSharedCollection ? 'updated_at' : 'order'

    return (
      <Fragment>
        <PageHeader
          record={collection}
          isHomepage={this.isHomepage}
        />
        <PageContainer>
          <CollectionGrid
            // pull in cols, gridW, gridH, gutter
            {...gridSettings}
            gridSettings={gridSettings}
            updateCollection={this.updateCollection}
            collection={collection}
            canEditCollection={collection.can_edit_content}
            // Pass in cardIds so grid will re-render when they change
            cardIds={collection.cardIds}
            // Pass in BCT state so grid will re-render when open/closed
            blankContentToolState={blankContentToolState}
            movingCardIds={uiMovingCardIds}
            // passing length prop seems to properly trigger a re-render
            movingCards={uiStore.movingCardIds.length}
            sortBy={sortBy}
            // don't add the extra row for submission box
            addEmptyCard={!collection.isSubmissionBox}
          />
          {(collection.requiresSubmissionBoxSettings || submissionBoxSettingsOpen) &&
            <SubmissionBoxSettingsModal
              collection={collection}
            />
          }
          <MoveModal />
          { submissions_collection && (
            <div>
              { this.loadingSubmissions
                ? <Loader />
                : (
                  <div>
                    {this.submissionsPageSeparator}
                    <CollectionGrid
                      {...gridSettings}
                      updateCollection={this.updateCollection}
                      collection={submissions_collection}
                      canEditCollection={false}
                      // Pass in cardIds so grid will re-render when they change
                      cardIds={submissions_collection.cardIds}
                      // Pass in BCT state so grid will re-render when open/closed
                      blankContentToolState={
                        blankContentToolState.collectionId === submissions_collection.id
                          ? blankContentToolState
                          : {}
                      }
                      submissionSettings={{
                        type: collection.submission_box_type,
                        template: collection.submission_template,
                      }}
                      movingCardIds={[]}
                      movingCards={false}
                      sortBy={sortBy}
                    />
                  </div>
                )}
            </div>
          )}
        </PageContainer>
      </Fragment>
    )
  }
}

CollectionPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}
CollectionPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionPage
