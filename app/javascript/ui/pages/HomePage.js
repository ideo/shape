import PropTypes from 'prop-types'
// import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import to from 'await-to-js'

// import withApi from '~/utils/withApi'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import CollectionGrid from '~/ui/grid/CollectionGrid'

// @withApi({
//   requestPath: ({ match }) => '/collections/me'
// })
@inject('apiStore')
@observer
class HomePage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // blank: null,
      cols: 4,
      myCollectionId: null
    }
  }

  async componentDidMount() {
    const { apiStore } = this.props
    const [err, response] = await to(apiStore.request('/collections/me'))
    if (response) {
      apiStore.sync(response)
      this.setState({ myCollectionId: response.data.id })
    } else if (err) {
      // console.log('error!', err)
    }
  }

  collection = () => {
    const { apiStore } = this.props
    if (!apiStore.collections.length) return null
    // const { id } = this.props.match.params
    return apiStore.find('collections', this.state.myCollectionId)
  }

  updateCollection = () => {
    // TODO: what if there's no collection?
    // calling .save() will receive any API updates and sync them
    this.collection().save()
  }

  render() {
    // const { apiStore } = this.props
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

HomePage.propTypes = {
  // match: ReactRouterPropTypes.match.isRequired,
}
HomePage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default HomePage
