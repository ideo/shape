import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
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
import PageWithApi from '~/ui/pages/PageWithApi'
import PageError from '~/ui/global/PageError'
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
class ItemPage extends PageWithApi {
  state = {
    item: null,
  }

  componentDidMount() {
    super.componentDidMount()
    const { match, apiStore } = this.props
    const item = apiStore.find('items', match.params.id)
    if (item && item.id) {
      this.setState({ item })
    }
  }

  onAPILoad = async response => {
    const { apiStore, uiStore, location } = this.props
    const item = response.data
    this.setState({ item })
    uiStore.setViewingItem(item)
    if (item.parent) item.parent.checkCurrentOrg()
    const thread = await apiStore.findOrBuildCommentThread(item)
    if (location.search) {
      const menu = uiStore.openOptionalMenus(location.search)
      if (menu === 'comments') {
        uiStore.expandThread(thread.key)
      }
    }
  }

  updateItem = itemTextData => {
    const { item } = this.state
    item.text_data = itemTextData
    this.setState({ item })
  }

  save = (item, { cancel_sync = true } = {}) =>
    item.API_updateWithoutSync({ cancel_sync })

  cancel = () => {
    const { item } = this.state
    if (item.can_edit_content) this.save(item)
    this.props.routingStore.push(item.parentPath)
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
    // this.error comes from PageWithApi
    if (this.error) return <PageError error={this.error} />

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
  match: ReactRouterPropTypes.match.isRequired,
  location: ReactRouterPropTypes.location.isRequired,
}
ItemPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ItemPage
