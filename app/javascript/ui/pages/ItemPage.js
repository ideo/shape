import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ArchivedBanner from '~/ui/layout/ArchivedBanner'
import FilePreview from '~/ui/grid/covers/FilePreview'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import ImageItem from '~/ui/items/ImageItem'
import Loader from '~/ui/layout/Loader'
import MoveModal from '~/ui/grid/MoveModal'
import PageContainer from '~/ui/layout/PageContainer'
import PageHeader from '~/ui/pages/shared/PageHeader'
import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import VideoItem from '~/ui/items/VideoItem'
import { ITEM_TYPES } from '~/utils/variables'
import { Helmet } from 'react-helmet'

const ItemPageContainer = styled.div`
  background: white;
  min-height: 75vh;
  position: relative;
`
ItemPageContainer.displayName = 'ItemPageContainer'

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class ItemPage extends React.Component {
  state = {
    // item is kept in state so that client can make local updates
    // e.g. updateItem method
    item: null,
  }

  componentDidMount() {
    this.onAPILoad()
  }

  onAPILoad = () => {
    const { item, apiStore, uiStore, routingStore } = this.props
    if (uiStore.actionAfterRoute) {
      uiStore.performActionAfterRoute()
    }
    this.setState({ item }, async () => {
      uiStore.update('dragTargets', [])
      uiStore.setViewingItem(item)
      if (item.parent)
        apiStore.checkCurrentOrg({ id: item.parent.organization_id })
      const thread = await apiStore.findOrBuildCommentThread(item)
      uiStore.expandThread(thread.key)
      if (routingStore.query) {
        uiStore.openOptionalMenus(routingStore.query)
      }
    })
  }

  updateItem = dataContent => {
    const { item } = this.state
    item.data_content = dataContent
    this.setState({ item })
  }

  save = (item, { cancel_sync = true } = {}) =>
    item.API_updateWithoutSync({ cancel_sync })

  cancel = ({ route = true } = {}) => {
    const { uiStore, routingStore } = this.props
    const { item } = this.state
    if (item.can_edit_content) this.save(item)
    if (!route) return
    if (uiStore.previousViewingCollection) {
      window.history.back()
    } else {
      routingStore.goToPath(item.parentPath)
    }
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
            onCancel={this.cancel}
            item={item}
            currentUserId={apiStore.currentUserId}
            fullPageView
            // this is important so we have the right data_content snapshot
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

  updateItemName = name => {
    const { item } = this.state
    item.name = name
    item.save()
    const { uiStore } = this.props
    uiStore.trackEvent('update', item)
  }

  saveText = (content, dataContent) => {
    const { item } = this.state
    item.content = content
    item.data_content = dataContent
    item.API_updateWithoutSync({ cancel_sync: true })
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
        <PageHeader record={item} />
        <ArchivedBanner />
        <ItemPageContainer>
          <PageContainer {...containerProps}>
            {item.parent_collection_card &&
            replacingId === item.parent_collection_card.id ? (
              <GridCardBlank parent={item.parent} afterCreate={this.reroute} />
            ) : (
              <div>
                {this.content}
                <MoveModal />
              </div>
            )}
          </PageContainer>
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
}

export default ItemPage
