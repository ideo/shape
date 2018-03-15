import SearchPage from '~/ui/pages/SearchPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, location, apiStore, uiStore, routingStore, props
const query = 'stuff'

beforeEach(() => {
  location = { search: `?q=${query}`, pathname: `/search?q=${query}` }
  apiStore = fakeApiStore({
    requestResult: { data: [] }
  })
  uiStore = fakeUiStore
  routingStore = {}
  props = { apiStore, uiStore, routingStore, location }

  wrapper = shallow(
    <SearchPage.wrappedComponent {...props} />
  )
})

describe('SearchPage', () => {
  it('makes an API call to fetch the search results', () => {
    expect(apiStore.request).toBeCalledWith(`search?query=${query}`)
  })

  it('displays the search results', () => {
    expect(wrapper.find('PageContainer').children().text()).toContain(`No results found for "${query}".`)
  })
})
