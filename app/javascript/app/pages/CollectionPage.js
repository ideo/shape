import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

import withAuth from '~/utils/withAuth'

@withAuth()
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
      </div>
    )
  }
}

export default CollectionPage
