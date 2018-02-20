import { RouterStore } from 'mobx-react-router'

// mobx-react-router with a couple of helper methods
class RoutingStore extends RouterStore {
  pathTo = (type, id) => {
    switch (type) {
    case 'collections':
      return `/collections/${id}`
    case 'items':
      return `/items/${id}`
    default:
      return ''
    }
  }

  routeTo = (type, id) => {
    const path = this.pathTo(type, id)
    this.push(path)
  }
}

export default RoutingStore
