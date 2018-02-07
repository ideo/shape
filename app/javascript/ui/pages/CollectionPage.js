import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

import CollectionGrid from '~/ui/grid/CollectionGrid'

@inject('apiStore')
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
    const { id } = this.props.match.params
    apiStore.request(`collections/${id}`).then((data) => {
      apiStore.sync(data)
    })
  }

  render () {
    const { apiStore } = this.props
    const { id } = this.props.match.params
    const collection = apiStore.find('collections', id)
    //
    if (!apiStore.collections.length || !collection) return <div>Loading</div>
    //
    // console.log(collection, apiStore)

    return (
      <div>
        <h1>Collection: {collection.name}</h1>
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
