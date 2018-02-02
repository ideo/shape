import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

import withAuth from '~/utils/withAuth'

const fakeCollections = [
  { id: 1, name: 'x' },
  { id: 2, name: 'y' },
  { id: 3, name: 'z' },
  { id: 4, name: 'zzzz' },
]

const CollectionsView = ({ collections }) => (
  collections.map(c => (
    <div key={c.id}>
      <Link to={`/collections/${c.id}`}>
        {c.name}
      </Link>
      <hr />
    </div>
  ))
)

@withAuth
@inject('routingStore', 'authStore')
@observer
class CollectionPage extends Component {
  doStuff = () => {
    this.props.authStore.loadUser({
      id: 1,
      firstName: 'Mister',
      lastName: 'Tester',
      email: 'mister@tester.com',
    })
  }

  render () {
    const { routingStore, authStore } = this.props
    const testThing = authStore.currentUser ? authStore.currentUser.fullName() : 'nope.'
    return (
      <div>
        <h1>Collection Page</h1>
        <div>
          { routingStore.location.pathname }
        </div>
        <button onClick={this.doStuff}>Heyo</button>
        <div>
          { JSON.stringify(authStore) }
          { testThing }
        </div>

        <CollectionsView collections={fakeCollections} />
      </div>
    )
  }
}

export default CollectionPage
