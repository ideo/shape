import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import PageWithApi from '~/ui/pages/PageWithApi'
import PageContainer from '~/ui/layout/PageContainer'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import v, { ITEM_TYPES } from '~/utils/variables'
import EditableName from './shared/EditableName'

const ItemPageContainer = styled.main`
  background: white;
  min-height: 75vh;
  position: relative;
`

const StyledRightColumn = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
`

const CloseLink = styled(Link)`
  /* add the .close class for more specificity to override quill theme-snow */
  text-decoration: none;
  color: ${v.colors.cloudy};
  &:hover {
    color: ${v.colors.linkHover};
  }
  padding: 0;
  height: auto;
  position: relative;
  top: -6px;
  font-size: 1.75rem;
`

@inject('apiStore')
@observer
class ItemPage extends PageWithApi {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    const { match, apiStore } = this.props
    return apiStore
      .fetch('items', match.params.id)
      .then(response => {
        const item = response.data
        this.setState({ item })
      })
  }

  get item() {
    const { apiStore } = this.props
    if (!apiStore.items.length) return null
    return this.state.item
  }

  // could be smarter or broken out once we want to do different things per type
  get content() {
    const { item } = this.state
    // similar function as in GridCard, could extract?
    switch (item.type) {
    case ITEM_TYPES.TEXT:
      return <TextItem item={item} />
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
  }

  render() {
    const { item } = this.state
    if (!item) return <Loader />
    return (
      <Fragment>
        <Header>
          <Breadcrumb items={item.breadcrumb} />
          <EditableName
            name={item.name}
            updateNameHandler={this.updateItemName}
          />
        </Header>
        <ItemPageContainer>
          <PageContainer>
            {/* TODO: calculate item container size? */}
            {this.content}
            <StyledRightColumn>
              <CloseLink to={item.parentPath}>
                &times;
              </CloseLink>
            </StyledRightColumn>
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
}

export default ItemPage
