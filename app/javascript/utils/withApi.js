import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import to from 'await-to-js'

const withApi = (options = {}) => (WrappedComponent) => (
  @inject('apiStore')
  @observer
  class WithApi extends Component {
    async componentDidMount() {
      const { requestPath } = options
      if (!requestPath) return
      const { apiStore } = this.props
      const [err, data] = await to(apiStore.request(requestPath(this.props)))
      if (data) {
        apiStore.sync(data)
      } else if (err) {
        // console.log('error!', err)
      }
    }

    // componentDidMount() {
    //   // const {
    //   //   authStore,
    //   //   routingStore
    //   // } = this.props
    //   // if (!authStore.currentUser) {
    //   //   console.warn('not allowed!', routingStore.location.pathname)
    //   //   // go back to homepage
    //   //   routingStore.push('/')
    //   // } else if (options.onSuccess) {
    //   //   options.onSuccess()
    //   // }
    //   if (options.onSuccess) {
    //     // options.onSuccess(authStore.currentUser.token)
    //     options.onSuccess()
    //   }
    // }
    //
    render() {
      return <WrappedComponent {...this.props} />
    }
  }
)

export default withApi
