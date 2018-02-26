import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import H1 from '~/ui/global/H1'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import v, { ITEM_TYPES } from '~/utils/variables'

const ItemPageContainer = styled.main`
  width: 100%;
  height: 100%;
  background: white;
  margin: ${v.headerHeight}px auto 0;
  position: absolute;
  top: 0;
  left: 0;
`

@inject('apiStore')
@observer
class ItemPage extends PageWithApi {
  get item() {
    const { match, apiStore } = this.props
    if (!apiStore.items.length) return null
    return apiStore.find('items', match.params.id)
  }

  // could be smarter or broken out once we want to do different things per type
  get content() {
    const { item } = this
    // similar function as in GridCard, could extract?
    switch (item.type) {
    case ITEM_TYPES.TEXT:
      return <TextItem item={item} editable padding="2rem" />
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

  render() {
    const { item } = this
    if (!item) return <Loader />

    return (
      <Fragment>
        <Header>
          <Breadcrumb items={item.breadcrumb} />
          <H1>{item.name}</H1>
        </Header>
        <ItemPageContainer>
          {/* TODO: calculate item container size? */}
          {this.content}
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
}

export default ItemPage
