import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

import CollectionGrid from '~/ui/grid/CollectionGrid'

@inject('routingStore', 'collectionStore')
@observer
class CollectionPage extends Component {
  // state = {
  //   blank: null,
  //   cols: 4
  // }

  componentWillMount() {
    const { collectionStore } = this.props
    const { id } = this.props.match.params
    collectionStore.fetchCollection(id)
  }

  render () {
    const { routingStore, collectionStore } = this.props
    const { collection } = collectionStore
    //
    if (!collection) return <div>Loading</div>
    //
    return (
      <div>
        <h1>Collection Page: {collection.name}</h1>
        <div>
          { routingStore.location.pathname }
        </div>
        {/* <CollectionGrid /> */}
      </div>
    )
  }
}

export default CollectionPage
