import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import ActionCableConsumer from '~/utils/ActionCableConsumer'
import PageWithApi from '~/ui/pages/PageWithApi'
import PageContainer from '~/ui/layout/PageContainer'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import CloseIcon from '~/ui/icons/CloseIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
import EditableName from './shared/EditableName'
import PageMenu from './shared/PageMenu'
import { StyledTitleAndRoles } from './shared/styled'

const ItemPageContainer = styled.main`
  background: white;
  min-height: 75vh;
  position: relative;
`
ItemPageContainer.displayName = 'ItemPageContainer'

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
    color: black;
  }
  padding: 0;
  height: auto;
  position: relative;
  top: -6px;
  .icon {
    width: 12px;
    height: 12px;
  }
`

@inject('apiStore', 'uiStore')
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
    const item = response.data
    this.setState({ item })
    if (item.parent) item.parent.checkCurrentOrg()
  }

  updateItem = (itemTextData) => {
    const { item } = this.state
    item.text_data = itemTextData

    this.setState({ item })
  }

  save = (item, { cancel_sync = true } = {}) => (
    item.API_updateWithoutSync({ cancel_sync })
  )

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
  }

  render() {
    const { uiStore } = this.props
    const { item } = this.state
    if (!item) return <Loader />

    return (
      <Fragment>
        <Header>
          <Breadcrumb items={item.breadcrumb} />
          <StyledTitleAndRoles justify="space-between">
            <Box className="title">
              <EditableName
                name={item.name}
                updateNameHandler={this.updateItemName}
                canEdit={item.can_edit}
              />
            </Box>
            <Flex align="baseline" className="item-page">
              <PageMenu
                record={item}
                canEdit={item.can_edit}
                menuOpen={uiStore.pageMenuOpen}
                disablePermissions
              />
            </Flex>
          </StyledTitleAndRoles>
        </Header>
        <ItemPageContainer>
          <PageContainer>
            {/* TODO: calculate item container size? */}
            {this.content}
            <StyledRightColumn>
              <CloseLink to={item.parentPath}>
                <CloseIcon />
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ItemPage
