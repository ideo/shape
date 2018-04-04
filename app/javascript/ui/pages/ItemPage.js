import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { animateScroll as scroll } from 'react-scroll'

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
    const { item } = this
    item.name = name
    item.save()
  }

  render() {
    const { uiStore } = this.props
    const { item } = this
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
