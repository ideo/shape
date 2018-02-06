import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

import CollectionGrid from '~/ui/grid/CollectionGrid'

@inject('routingStore', 'apiStore')
@observer
class CollectionPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // blank: null,
      cols: 4,
    }
  }

  componentWillMount() {
    const { apiStore } = this.props
    // const { id } = this.props.match.params
    apiStore.request('test.json').then((data) => {
      apiStore.sync(data)
    })
  }

  componentWillReceiveProps(nextProps) {
    console.log('CollectionPage', nextProps)
  }

  render () {
    const { routingStore, apiStore } = this.props
    //
    if (!apiStore.collections.length) return <div>Loading</div>
    //
    // const { id } = this.props.match.params
    // const collection = apiStore.find('collections', id)
    const collection = apiStore.collections[0]

    return (
      <div>
        <h1>Collection Page: {collection.name}</h1>
        <div>
          { routingStore.location.pathname }
        </div>
        <CollectionGrid
          cols={this.state.cols}
          gridH={200}
          gridW={300}
          gutter={12}
          collection={collection}
        />
      </div>
    )
  }
}

export default CollectionPage
