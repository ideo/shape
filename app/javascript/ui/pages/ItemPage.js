import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ActionCableConsumer from '~/utils/ActionCableConsumer'
import FilePreview from '~/ui/grid/covers/FilePreview'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import ImageItem from '~/ui/items/ImageItem'
import Loader from '~/ui/layout/Loader'
import MoveModal from '~/ui/grid/MoveModal'
import PageContainer from '~/ui/layout/PageContainer'
import PageHeader from '~/ui/pages/shared/PageHeader'
import TextItem from '~/ui/items/TextItem'
import VideoItem from '~/ui/items/VideoItem'
import { ITEM_TYPES } from '~/utils/variables'

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
    this.setState({ item }, async () => {
      uiStore.update('dragTargets', [])
      uiStore.setViewingItem(item)
      if (item.parent) item.parent.checkCurrentOrg()
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

  cancel = () => {
    const { uiStore } = this.props
    const { item } = this.state
    if (item.can_edit_content) this.save(item)

    if (uiStore.previousViewingCollection) {
      window.history.back()
    } else {
      this.props.routingStore.push(item.parentPath)
    }
  }

  // could be smarter or broken out once we want to do different things per type
  get content() {
    const { item } = this.state
    const { currentUserId } = this.props.apiStore
    // similar function as in GridCard, could extract?
    switch (item.type) {
      case ITEM_TYPES.TEXT:
        return (
          <TextItem
            item={item}
            actionCableConsumer={ActionCableConsumer}
            currentUserId={currentUserId}
            onUpdatedData={this.updateItem}
            onSave={this.save}
            onCancel={this.cancel}
            fullPageView
          />
        )
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

  render() {
    const { uiStore } = this.props
    const { item } = this.state
    if (!item) return <Loader />
    if (item.isPdfFile) {
      return <FilePreview file={item.filestack_file} />
    }

    const { replacingId } = uiStore.blankContentToolState

    return (
      <Fragment>
        <PageHeader record={item} />
        <ItemPageContainer>
          <PageContainer>
            {item.parent_collection_card &&
            replacingId === item.parent_collection_card.id ? (
              <GridCardBlank
                height={1}
                parent={item.parent}
                afterCreate={this.reroute}
              />
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
