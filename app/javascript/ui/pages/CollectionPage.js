// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import withApi from '~/utils/withApi'
import Loader from '~/ui/layout/Loader'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'
// import Icon from '~/ui/global/Icon'
import H1 from '~/ui/global/H1'
import Breadcrumb from '~/ui/layout/Breadcrumb'

const isHomepage = match => match.path === '/'

@withApi({
  requestPath: ({ match, apiStore }) => {
    if (isHomepage(match)) {
      return `collections/${apiStore.currentUser.current_user_collection_id}`
    }
    return `collections/${match.params.id}`
  }
})
@observer
class CollectionPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // blank: null,
      cols: 4,
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

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection.save()
  }

  render() {
    const { collection } = this
    // console.log('thiscollection', this.props.apiStore, collection)
    if (!collection) return <Loader />

    return (
      <Fragment>
        <Header>
          <H1>{collection.name}</H1>
          {/* <Icon name="caret" size="8px" /> */}
          <Breadcrumb
            items={collection.breadcrumb}
          />
        </Header>
        <PageContainer>
          <CollectionGrid
            cols={this.state.cols}
            gridH={200}
            gridW={300}
            gutter={12}
            updateCollection={this.updateCollection}
            collection={collection}
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
}

export default CollectionPage
