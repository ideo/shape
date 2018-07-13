import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import PageError from '~/ui/global/PageError'
import ActionCableConsumer from '~/utils/ActionCableConsumer'
import PageWithApi from '~/ui/pages/PageWithApi'
import PageContainer from '~/ui/layout/PageContainer'
import Loader from '~/ui/layout/Loader'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import PageHeader from '~/ui/pages/shared/PageHeader'
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
    item: null
  }

  componentDidMount() {
    super.componentDidMount()
    const { match, apiStore } = this.props
    const item = apiStore.find('items', match.params.id)
    if (item && item.id) {
      this.setState({ item })
    }
  }

  onAPILoad = (response) => {
    const { apiStore, uiStore } = this.props
    const item = response.data
    this.setState({ item })
    uiStore.setViewingItem(item)
    if (item.parent) item.parent.checkCurrentOrg()
    apiStore.findOrBuildCommentThread(item)
  }

  updateItem = (itemTextData) => {
    const { item } = this.state
    item.text_data = itemTextData
    this.setState({ item })
  }

  save = (item, { cancel_sync = true } = {}) => (
    item.API_updateWithoutSync({ cancel_sync })
  )

  cancel = (item) => {
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
    case ITEM_TYPES.IMAGE:
      return <ImageItem item={item} backgroundSize="contain" />
    case ITEM_TYPES.VIDEO:
      return <VideoItem item={item} />
    default:
      return (
        <div>Item not found.</div>
      )
    }
  }

  requestPath = (props) => {
    const { match } = props
    return `items/${match.params.id}`
  }

  updateItemName = (name) => {
    const { item } = this.state
    item.name = name
    item.save()
    const { uiStore } = this.props
    uiStore.trackEvent('update', item)
  }

  render() {
    // this.error comes from PageWithApi
    if (this.error) return <PageError error={this.error} />

    const { item } = this.state
    if (!item) return <Loader />

    return (
      <Fragment>
        <PageHeader record={item} />
        <ItemPageContainer>
          <PageContainer>
            {/* TODO: calculate item container size? */}
            {this.content}
          </PageContainer>
        </ItemPageContainer>
      </Fragment>
    )
  }
}

ItemPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}
ItemPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ItemPage
