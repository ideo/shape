// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import PageWithApi from '~/ui/pages/PageWithApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'
import H1 from '~/ui/global/H1'
import Breadcrumb from '~/ui/layout/Breadcrumb'

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

  requestPath = (props) => {
    const { match, apiStore } = props
    if (isHomepage(match)) {
      return `collections/${apiStore.currentUser.current_user_collection_id}`
    }
    return `collections/${match.params.id}`
  }

  onAPILoad = (collection) => {
    const { uiStore } = this.props
    if (!collection.collection_cards.length) {
      uiStore.openBlankContentTool()
    }
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection.API_updateCardOrder()
  }

  render() {
    const { collection } = this
    const { uiStore } = this.props
    // console.log(this.props.apiStore, collection)
    if (!collection) return <Loader />

    const breadcrumb = this.isHomepage ? [] : collection.breadcrumb

    return (
      <Fragment>
        <Header>
          <Breadcrumb items={breadcrumb} />
          <H1>{collection.name}</H1>
        </Header>
        <PageContainer>
          <CollectionGrid
            // pull in cols, gridW, gridH, gutter
            {...uiStore.gridSettings}
            updateCollection={this.updateCollection}
            collection={collection}
            blankContentToolState={uiStore.blankContentToolState}
          />
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
