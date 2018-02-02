import { types } from 'mobx-state-tree'

const fakeCollections = [
  { id: 1, name: 'x' },
  { id: 2, name: 'y' },
  { id: 3, name: 'z' },
  { id: 4, name: 'zzzz' },
]

// define User model
const Collection = types
  .model('Collection', {
    id: types.identifier(types.number),
    name: types.string,
    type: types.maybe(types.number),
  })

// define model for storing User model
const CollectionStore = types
  .model('CollectionStore', {
    loading: types.optional(types.boolean, false),
    collections: types.optional(types.array(Collection), [])
  })
  .actions(self => ({
    setCollections(data) {
      self.collections = data
    },
    setLoading(value) {
      self.loading = value
    },
    loadCollections(data) {
      self.loading = true
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data) {
            self.setCollections(data)
          } else {
            self.setCollections(fakeCollections)
          }
          self.setLoading(false)
          resolve('hi')
        }, 1000)
      })
    }
  }))

export default CollectionStore
