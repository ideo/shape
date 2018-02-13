import CollectionPage from '~/ui/pages/CollectionPage'
import createComponentWithIntl from '../js_test_config/intl-enzyme-test-helper.js'

const id = 1
const collections = [
  { id: 1, name: 'My Workspace X' }
]
let wrapper, match, request, find, apiStore
let props
beforeEach(() => {
  match = { params: { id } }
  request = jest.fn()
  request.mockReturnValue(Promise.resolve({}))
  find = jest.fn()
  find.mockReturnValue(collections[0])
  apiStore = {
    request,
    find,
    sync: jest.fn(),
    collections,
  }
  props = { apiStore, match }
  wrapper = shallow(
    <CollectionPage.wrappedComponent {...props} />
  )
})

describe('CollectionPage', () => {
  it('makes an API call to fetch the collection', () => {
    expect(request).toBeCalledWith(`collections/${match.params.id}`)
  })

  it('displays the collection name', () => {
    expect(wrapper.find('h1').at(0).text()).toBe('Collection: My Workspace X')
  })

  it('renders correctly', () => {
    wrapper = createComponentWithIntl(
      <CollectionPage.wrappedComponent {...props} />
    )
    const tree = wrapper.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
