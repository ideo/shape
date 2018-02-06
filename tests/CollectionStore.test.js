import CollectionStore from '~/stores/Collection'

const fakeCollections = [
  { id: 1, name: 'x' },
  { id: 2, name: 'y' },
  { id: 3, name: 'z' },
  { id: 4, name: 'zzzz' },
]

describe('CollectionStore', () => {
  it('sets a `loading` value', () => {
    const store = CollectionStore.create()
    store.setLoading(true)
    expect(store.loading).toBe(true)
  })
  it('can load collections', () => {
    const store = CollectionStore.create()
    expect.assertions(1)
    store.loadCollections(fakeCollections).then(data => {
      expect(data).toBe('hi')
    })
  })
})
