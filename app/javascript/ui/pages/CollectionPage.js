import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import MoveModal from '~/ui/grid/MoveModal'
import RolesSummary from '~/ui/roles/RolesSummary'
import Roles from '~/ui/grid/Roles'
import EditableName from './shared/EditableName'
import PageMenu from './shared/PageMenu'
import { StyledTitleAndRoles } from './shared/styled'

const isHomepage = ({ path }) => path === '/'

@inject('apiStore', 'uiStore')
@observer
class CollectionPage extends PageWithApi {
  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    // when navigating between collections, close BCT
    if (nextProps.match.params.id !== this.props.match.params.id) {
      this.props.uiStore.closeBlankContentTool()
    }
  }

  componentWillUnmount() {
    const { uiStore } = this.props
    uiStore.setViewingCollection(null)
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

  onAPILoad = (response) => {
    const collection = response.data
    const { uiStore } = this.props
    collection.checkResponseForEmptyCards(response)
    if (!collection.collection_cards.length) {
      uiStore.openBlankContentTool()
    }
    uiStore.setViewingCollection(collection)
  }

  showObjectRoleDialog = () => {
    const { uiStore } = this.props
    uiStore.update('rolesMenuOpen', true)
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection.API_updateCards()
  }

  updateCollectionName = (name) => {
    this.collection.name = name
    this.collection.save()
  }

  render() {
    const { collection } = this
    const { uiStore } = this.props
    if (!collection || this.props.uiStore.isLoading) return <Loader />

    const breadcrumb = this.isHomepage ? [] : collection.breadcrumb

    return (
      <Fragment>
        <Header>
          <Breadcrumb items={breadcrumb} />
          <StyledTitleAndRoles justify="space-between">
            <Box className="title">
              <EditableName
                name={collection.name}
                updateNameHandler={this.updateCollectionName}
                canEdit={collection.can_edit && !this.collection.isUserCollection}
              />
            </Box>
            <Flex align="baseline">
              {this.collection.isNormalCollection &&
                <Fragment>
                  <RolesSummary
                    className="roles-summary"
                    handleClick={this.showObjectRoleDialog}
                    roles={collection.roles}
                    canEdit={collection.can_edit}
                  />
                  <PageMenu
                    record={collection}
                    menuOpen={uiStore.pageMenuOpen}
                    canEdit={collection.can_edit}
                  />
                </Fragment>
              }
            </Flex>
          </StyledTitleAndRoles>
        </Header>
        <PageContainer>
          <Roles
            collectionId={collection.id}
            roles={collection.roles}
          />
          <CollectionGrid
            // pull in cols, gridW, gridH, gutter
            {...uiStore.gridSettings}
            gridSettings={uiStore.gridSettings}
            updateCollection={this.updateCollection}
            collection={collection}
            canEditCollection={collection.can_edit}
            // Pass in cardIds so grid will re-render when they change
            cardIds={collection.cardIds}
            // Pass in BCT state so grid will re-render when open/closed
            blankContentToolState={uiStore.blankContentToolState}
          />
          <MoveModal />
        </PageContainer>
      </Fragment>
    )
  }
}

CollectionPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}
CollectionPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionPage
