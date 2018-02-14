// import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import withApi from '~/utils/withApi'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'

@withApi({
  requestPath: ({ match }) => `/collections/${match.params.id}`
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

  collection = () => {
    const { apiStore } = this.props
    if (!apiStore.collections.length) return null
    const { id } = this.props.match.params
    return apiStore.find('collections', id)
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection().save()
  }

  render() {
    const collection = this.collection()
    if (!collection) return <div>Loading</div>

    return (
      <div>
        <Header />
        <PageContainer>
          <h1>Collection: {collection.name}</h1>
          <CollectionGrid
            cols={this.state.cols}
            gridH={200}
            gridW={300}
            gutter={12}
            updateCollection={this.updateCollection}
            collection={collection}
          />
        </PageContainer>
      </div>
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
