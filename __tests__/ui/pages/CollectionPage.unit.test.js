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

  it('displays the collection name', () => {
    expect(wrapper.find('EditableName').exists()).toEqual(true)
    expect(wrapper.find('EditableName').props().name).toEqual(collection.name)
  })

  it('passes canEdit = false to EditableName', () => {
    expect(wrapper.find('EditableName').props().canEdit).toEqual(false)
  })

  it('passes canEdit = false to RolesSummary', () => {
    expect(wrapper.find('RolesSummary').props().canEdit).toEqual(false)
  })

  it('passes collection to the CollectionGrid', () => {
    const grid = wrapper.find('InjectedCollectionGrid')
    expect(grid.props().collection).toBe(collection)
  })

  it('shows the roles edit menu on click of roles summary add button', () => {
    wrapper.instance().showObjectRoleDialog()
    expect(uiStore.openRolesMenu).toHaveBeenCalled()
  })

  describe('as editor', () => {
    beforeEach(() => {
      collection.can_edit = true
      wrapper = shallow(
        <CollectionPage.wrappedComponent {...props} />
      )
    })

    it('passes canEdit = true to EditableName', () => {
      expect(wrapper.find('EditableName').props().canEdit).toEqual(true)
    })

    it('passes canEdit = true to RolesSummary', () => {
      expect(wrapper.find('RolesSummary').props().canEdit).toEqual(true)
    })
  })
})
