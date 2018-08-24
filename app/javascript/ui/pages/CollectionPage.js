import { Fragment } from 'react'
import pluralize from 'pluralize'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import PageError from '~/ui/global/PageError'
import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import PageContainer from '~/ui/layout/PageContainer'
import PageSeparator from '~/ui/global/PageSeprator'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import MoveModal from '~/ui/grid/MoveModal'
import PageHeader from '~/ui/pages/shared/PageHeader'
import SubmissionBoxSetupModal from '~/ui/submission_box/SubmissionBoxSetupModal'

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

  render() {
    // this.error comes from PageWithApi
    if (this.error) return <PageError error={this.error} />

    const { collection } = this
    const { uiStore } = this.props
    if (!collection || collection.can_edit === undefined) return <Loader />
    const { movingCardIds, cardAction } = uiStore
    // only tell the Grid to hide "movingCards" if we're moving and not linking
    const uiMovingCardIds = cardAction === 'move' ? movingCardIds : []
    // SharedCollection has special behavior where it sorts by most recently updated
    const sortBy = collection.isSharedCollection ? 'updated_at' : 'order'

    const submissionBCTState = {
      order: 0,
      width: 1,
      height: 1,
      emptyCollection: true,
      type: 'submission',
      parent_id: collection.submissions_collection && collection.submissions_collection.id,
      template: collection.submission_template,
    }

    return (
      <Fragment>
        <PageHeader
          record={collection}
          isHomepage={this.isHomepage}
        />
        <PageContainer>
          <CollectionGrid
            // pull in cols, gridW, gridH, gutter
            {...uiStore.gridSettings}
            gridSettings={uiStore.gridSettings}
            updateCollection={this.updateCollection}
            collection={collection}
            canEditCollection={collection.can_edit_content}
            // Pass in cardIds so grid will re-render when they change
            cardIds={collection.cardIds}
            // Pass in BCT state so grid will re-render when open/closed
            blankContentToolState={uiStore.blankContentToolState}
            movingCardIds={uiMovingCardIds}
            // passing length prop seems to properly trigger a re-render
            movingCards={uiStore.movingCardIds.length}
            sortBy={sortBy}
            addEmptyCard={!collection.submissions_collection}
          />
          {collection.requiresSubmissionBoxSetup &&
            <SubmissionBoxSetupModal
              collection={collection}
            />
          }
          <MoveModal />
          { collection.submissions_collection && (
            <div>
              { this.loadingSubmissions
                ? <Loader />
                : (
                  <div>
                    <PageSeparator title={(
                      <h3>
                        {collection.submissions_collection.collection_cards.length}
                        {' '}
                        {pluralize(collection.submission_template.name)}
                      </h3>
                    )} />
                    <CollectionGrid
                      {...uiStore.gridSettings}
                      updateCollection={this.updateCollection}
                      collection={collection.submissions_collection}
                      canEditCollection={false}
                      // Pass in cardIds so grid will re-render when they change
                      cardIds={collection.submissions_collection.cardIds}
                      // Pass in BCT state so grid will re-render when open/closed
                      blankContentToolState={submissionBCTState}
                      movingCardIds={[]}
                      // passing length prop seems to properly trigger a re-render
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
