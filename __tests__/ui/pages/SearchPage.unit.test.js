import SearchPage from '~/ui/pages/SearchPage'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, match, apiStore, props
const query = 'stuff'

beforeEach(() => {
  match = { params: { query }, path: `/search/${query}` }
  apiStore = fakeApiStore({
    requestResult: { data: [] }
  })
  props = { apiStore, match }

  wrapper = shallow(
    <SearchPage.wrappedComponent {...props} />
  )
})

describe('SearchPage', () => {
  it('makes an API call to fetch the search results', () => {
    expect(apiStore.request).toBeCalledWith(`search?query=${match.params.query}`)
  })

  it('displays the search results', () => {
    expect(wrapper.find('PageContainer').children().text()).toContain('You are searching now.')
  })
})
