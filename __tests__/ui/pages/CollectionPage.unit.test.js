import CollectionPage from '~/ui/pages/CollectionPage'
import apiStoreMock from '#/mocks/apiStoreMock'

const id = 1
const collections = [
  { id: 1, name: 'My Workspace X', breadcrumb: [] }
]
const collection = collections[0]
let wrapper, match, apiStore
let props

beforeEach(() => {
  match = { params: { id }, path: '/collections/1', url: '/collections/1' }
  apiStore = apiStoreMock({
    findResult: collection
  })
  apiStore.collections = collections
  props = { apiStore, match }
})

describe('CollectionPage', () => {
  it('makes an API call to fetch the collection', () => {
    wrapper = shallow(
      <CollectionPage.wrappedComponent {...props} />
    )
    expect(apiStore.request).toBeCalledWith(`collections/${match.params.id}`)
  })

  it('displays the collection name', () => {
    wrapper = shallow(
      <CollectionPage.Undecorated {...props} />
    )
    expect(wrapper.find('H1').children().text()).toBe(collection.name)
  })

  // it('renders correctly', () => {
  //   wrapper = renderer.create(
  //     <Provider apiStore={props.apiStore}>
  //       <CollectionPage {...props} />
  //     </Provider>
  //   )
  //   const tree = wrapper.toJSON()
  //   expect(tree).toMatchSnapshot()
  // })
})
