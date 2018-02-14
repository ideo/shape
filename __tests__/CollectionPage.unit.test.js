import CollectionPage from '~/ui/pages/CollectionPage'

const id = 1
const collections = [
  { id: 1, name: 'My Workspace X' }
]
let wrapper, match, request, find, apiStore
let props
beforeEach(() => {
  match = { params: { id }, path: '/collections/1', url: '/collections/1' }
  request = jest.fn()
  request.mockReturnValue(Promise.resolve({}))
  find = jest.fn()
  find.mockReturnValue(collections[0])
  apiStore = {
    request,
    find,
    sync: jest.fn(),
    collections,
    currentUser: {
      current_user_collection_id: 99
    }
  }
  props = { apiStore, match }
})

describe('CollectionPage', () => {
  it('makes an API call to fetch the collection', () => {
    wrapper = shallow(
      <CollectionPage.wrappedComponent {...props} />
    )
    expect(request).toBeCalledWith(`collections/${match.params.id}`)
  })

  it('displays the collection name', () => {
    wrapper = shallow(
      <CollectionPage.Undecorated {...props} />
    )
    expect(wrapper.find('H1').exists()).toBe(true)
    expect(wrapper.find('H1').children().text()).toBe(collections[0].name)
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
