import { types } from 'mobx-state-tree'

const fakeCollections = [
  { id: 1, name: 'x' },
  { id: 2, name: 'y' },
  { id: 3, name: 'z' },
  { id: 4, name: 'zzzz' },
]

const fakeCollection = {
  id: 1,
  name: 'My Collection',
  cards: [
    {
      id: 1,
      type: 'atom',
      name: 'Sub-item',
      order: 0,
      width: 1,
      height: 1,
      record: {
        id: 999,
        name: 'Heyo'
      }
    },
  ]
}

// define Collection models
export const CollectionCard = types
  .model('CollectionCard', {
    id: types.identifier(types.number),
    record: types.model({
      id: types.number,
      name: types.string
    }),
    name: types.string,
    type: types.string,
    order: types.number,
    width: types.number,
    height: types.number,
  })

export const Collection = types
  .model('Collection', {
    id: types.identifier(types.number),
    name: types.string,
    cards: types.optional(types.array(CollectionCard), []),
    // type: types.maybe(types.number),
  })

// define model for storing User model
export const CollectionStore = types
  .model('CollectionStore', {
    loading: types.optional(types.boolean, false),
    collections: types.optional(types.array(Collection), []),
    collection: types.maybe(Collection),
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
        }, 1000)
        resolve('hi')
      })
    },
    fetchCollection(id) {
      self.collection = fakeCollection
    }
  }))

export default CollectionStore
