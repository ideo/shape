class PageWithApi extends React.Component {
  componentDidMount() {
    // this will get called on initial render
    this.fetchData(this.props)
  }

  componentWillReceiveProps(nextProps) {
    // this will get called e.g. if you switch between CollectionPages
    // (component does not "re-mount" between routes, but the props change)
    this.fetchData(nextProps)
  }

  // to be overridden in child class
  onAPILoad = () => null
  requestPath = () => ''

  fetchData = (props) => {
    if (!this.requestPath) return null
    const { apiStore } = props
    return apiStore.request(this.requestPath(props))
      .then(response => {
        // to be created in child class
        if (this.onAPILoad) {
          this.onAPILoad(response.data)
        }
      })
      // .catch(err => console.log('error!', err))
  }
}

export default PageWithApi
