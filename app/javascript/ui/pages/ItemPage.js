import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Helmet } from 'react-helmet'

import ArchivedBanner from '~/ui/layout/ArchivedBanner'
import FilePreview from '~/ui/grid/covers/FilePreview'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import ImageItem from '~/ui/items/ImageItem'
import Loader from '~/ui/layout/Loader'
import GlobalPageComponentsContainer from '~/ui/grid/GlobalPageComponentsContainer'
import PageContainer from '~/ui/layout/PageContainer'
import PageHeader from '~/ui/pages/shared/PageHeader'
import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import VideoItem from '~/ui/items/VideoItem'
import { ITEM_TYPES } from '~/utils/variables'
import TextActionMenu from '~/ui/grid/TextActionMenu'

const ItemPageContainer = styled.div`
  background: white;
  min-height: 75vh;
  position: relative;
`
ItemPageContainer.displayName = 'ItemPageContainer'

@inject('apiStore', 'uiStore', 'routingStore', 'undoStore')
@observer
class ItemPage extends React.Component {
  state = {
    // item is kept in state so that client can make local updates
    // e.g. updateItem method
    item: null,
  }
  containerRef = React.createRef()

  componentDidMount() {
    this.onAPILoad()
  }

  onAPILoad = () => {
    const { item, apiStore, uiStore, undoStore } = this.props
    if (uiStore.actionAfterRoute) {
      uiStore.performActionAfterRoute()
    }
    this.setState({ item }, async () => {
      uiStore.update('dragTargets', [])
      uiStore.setViewingRecord(item)
      apiStore.setupCommentThreadAndMenusForPage(item)
      if (item.parent) {
        apiStore.checkCurrentOrg({ id: item.parent.organization_id })
      }
      if (undoStore.actionAfterRoute) {
        // the only relevant one is a text item undo
        undoStore.performActionAfterRoute()
      }
    })
  }

  save = (item, { cancel_sync = true } = {}) =>
    item.API_updateWithoutSync({ cancel_sync })

  cancel = ({ item = this.state.item, route = true, num_viewers = 1 } = {}) => {
    const { uiStore, routingStore } = this.props
    if (item.can_edit_content && num_viewers === 1) {
      this.save(item)
    }
    if (!route) return
    const { previousViewingRecord } = uiStore
    if (
      previousViewingRecord &&
      previousViewingRecord.internalType === 'collections'
    ) {
      routingStore.setRoutingTo('collections', previousViewingRecord.id)
      window.history.back()
    } else {
      routingStore.goToPath(item.parentPath)
    }
  }

  // Should this get attached to PageContainer?
  // It's on GridCard already but this.content doesn't return a grid card
  openContextMenu = ev => {
    const { containerRef } = this
    const { item, uiStore } = this.props
    const { parent_collection_card } = item
    if (!item.isText || !containerRef || !containerRef.getBoundingClientRect) {
      return
    }
    // prevent default contextmenu
    ev.preventDefault()

    const rect = containerRef.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top

    uiStore.openContextMenu(ev, {
      x,
      y,
      card: parent_collection_card,
      menuItemCount: 1, // Until we change the text action menu
    })
  }

  // could be smarter or broken out once we want to do different things per type
  get content() {
    const { apiStore } = this.props
    const { item } = this.state

    // similar function as in GridCard, could extract?
    switch (item.type) {
      case ITEM_TYPES.TEXT:
        return (
          <RealtimeTextItem
            containerRef={c => (this.containerRef = c)}
            onCancel={this.cancel}
            item={item}
            currentUserId={apiStore.currentUserId}
            fullPageView
            // this is important so we have the right quill_data snapshot
            fullyLoaded={item.fullyLoaded}
          />
        )
      case ITEM_TYPES.EXTERNAL_IMAGE:
      case ITEM_TYPES.FILE:
        return (
          <ImageItem
            onCancel={this.cancel}
            item={item}
            backgroundSize="contain"
          />
        )
      case ITEM_TYPES.VIDEO:
        return <VideoItem item={item} />
      default:
        return <div>Item not found.</div>
    }
  }

  requestPath = props => {
    const { match } = props
    return `items/${match.params.id}`
  }

  reroute = card => {
    const { routingStore } = this.props
    routingStore.routeTo('items', card.record.id)
  }

  render() {
    const { uiStore } = this.props
    const { item } = this.state
    if (!item) return <Loader />
    if (item.isPdfFile) {
      return <FilePreview file={item.filestack_file} />
    }

    const { replacingId } = uiStore.blankContentToolState

    let containerProps = {}
    if (
      item.type === ITEM_TYPES.EXTERNAL_IMAGE ||
      item.type === ITEM_TYPES.FILE
    ) {
      containerProps = {
        fullWidth: true,
        padding: 0,
      }
    }
    return (
      <Fragment>
        <Helmet title={item.pageTitle} />
        <ArchivedBanner />
        <PageHeader record={item} />
        <ItemPageContainer onContextMenu={this.openContextMenu}>
          <PageContainer {...containerProps}>
            {item.parent_collection_card && (
              <TextActionMenu card={item.parent_collection_card} />
            )}

            {item.parent_collection_card &&
            replacingId === item.parent_collection_card.id ? (
              <GridCardBlank parent={item.parent} afterCreate={this.reroute} />
            ) : (
              this.content
            )}
          </PageContainer>
          <GlobalPageComponentsContainer />
        </ItemPageContainer>
      </Fragment>
    )
  }
}

ItemPage.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}
ItemPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  undoStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ItemPage
