import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

import withAuth from '~/utils/withAuth'

const CollectionList = ({ collections }) => (
  collections.map(c => (
    <div key={c.id}>
      <Link to={`/collections/${c.id}`}>
        {c.name}
      </Link>
      <hr />
    </div>
  ))
)

// Homepage component
@withAuth({
  store: 'collectionStore',
  method: 'loadCollections'
})
@inject('collectionStore')
@observer
class HomePage extends Component {
  render () {
    return (
      <div>
        <h1>Collection List</h1>
        <div>
          {this.props.collectionStore.loading ? 'loading' : 'not loading'}
        </div>
        <CollectionList collections={this.props.collectionStore.collections} />
      </div>
    )
  }
}

export default HomePage
