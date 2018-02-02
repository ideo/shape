import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

const withAuth = (options = {}) => (WrappedComponent) => (
  @inject('authStore', 'collectionStore', 'routingStore')
  @observer
  class WithAuth extends Component {
    componentWillMount() {
      // const {
      //   authStore,
      //   routingStore
      // } = this.props
      // if (!authStore.currentUser) {
      //   console.warn('not allowed!', routingStore.location.pathname)
      //   // go back to homepage
      //   routingStore.push('/')
      // } else if (options && options.store && this.props[options.store]) {
      //   // call passed method
      //   const store = this.props[options.store]
      // }
      if (options && options.store && this.props[options.store]) {
        const store = this.props[options.store]
        store[options.method]()
      }
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }
)

export default withAuth
