import React from 'react'
import { inject, observer } from 'mobx-react'

const withApi = ({ requestPath }) => (WrappedComponent) => {
  @inject('apiStore')
  @observer
  class WithApi extends React.Component {
    componentDidMount() {
      // this will get called on initial render
      this.fetchData(this.props)
    }

    componentWillReceiveProps(nextProps) {
      // this will get called if you switch between CollectionPages
      // (component does not "re-mount" between routes, but the props change)
      this.fetchData(nextProps)
    }

    fetchData = (props) => {
      if (!requestPath) return
      const { apiStore } = props
      apiStore.request(requestPath(props))
        .then(response => apiStore.sync(response))
        // .catch(err => console.log('error!', err))
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }
  WithApi.Undecorated = WrappedComponent

  return WithApi
}

export default withApi
