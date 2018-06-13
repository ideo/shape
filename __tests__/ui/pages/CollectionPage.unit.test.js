import CollectionPage from '~/ui/pages/CollectionPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
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
let wrapper, match, apiStore, uiStore
let props

beforeEach(() => {
  match = { params: { id }, path: '/collections/1', url: '/collections/1' }
  apiStore = fakeApiStore({
    findResult: collection,
    findAllResult: collections,
    requestResult: { data: collection }
  })
  apiStore.collections = collections
  uiStore = fakeUiStore
  props = { apiStore, uiStore, match }

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
})
