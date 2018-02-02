import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

const withAuth = (options = {}) => (WrappedComponent) => (
  @inject('authStore')
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
      // } else if (options.onSuccess) {
      //   options.onSuccess()
      // }
      if (options.onSuccess) {
        // options.onSuccess(authStore.currentUser.token)
        options.onSuccess()
      }
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }
)

export default withAuth
