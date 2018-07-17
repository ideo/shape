import CollectionPage from '~/ui/pages/CollectionPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import {
  fakeCollection
} from '#/mocks/data'

const id = 1
const collections = [
  Object.assign({}, fakeCollection, { id: 1 }),
  Object.assign({}, fakeCollection, { id: 2 }),
  Object.assign({}, fakeCollection, { id: 3 }),
]
const collection = collections[0]
let wrapper, match, apiStore, uiStore, routingStore
let props

beforeEach(() => {
  apiStore = fakeApiStore({
    findResult: collection,
    findAllResult: collections,
    requestResult: { data: collection }
  })
  apiStore.collections = collections
  uiStore = fakeUiStore
  routingStore = fakeRoutingStore
  match = { params: { id, org: apiStore.currentOrgSlug }, path: '/collections/1', url: '/collections/1' }
  props = { apiStore, uiStore, routingStore, match }

  wrapper = shallow(
    <CollectionPage.wrappedComponent {...props} />
  )
})

describe('CollectionPage', () => {
  it('makes an API call to fetch the collection', () => {
    expect(apiStore.request).toBeCalledWith(`collections/${match.params.id}`)
    expect(apiStore.find).toBeCalledWith('collections', match.params.id)
  })

  it('passes collection to the CollectionGrid', () => {
    const grid = wrapper.find('CollectionGrid')
    expect(grid.props().collection).toBe(collection)
  })

  describe('updateCollectionName', () => {
    beforeEach(() => {
      wrapper.instance().updateCollectionName('great')
    })

    it('should set the collection name to passed in value', () => {
      expect(collection.name).toEqual('great')
    })

    it('should track an event for updating the collection', () => {
      expect(uiStore.trackEvent).toHaveBeenCalledWith('update', collection)
    })
  })

  describe('updateCollection', () => {
    beforeEach(() => {
      wrapper.instance().updateCollection()
    })

    it('should update the collection cards through api', () => {
      expect(collection.API_updateCards).toHaveBeenCalled()
    })

    it('should track an event for updating the collection', () => {
      expect(uiStore.trackEvent).toHaveBeenCalledWith('update', collection)
    })
  })
})
