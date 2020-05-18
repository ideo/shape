import SearchPage from '~/ui/pages/SearchPage'
import Deactivated from '~/ui/layout/Deactivated'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

// needed for checkOrg import
jest.mock('../../../app/javascript/stores')

let wrapper, location, match
let apiStore, uiStore, props
const query = 'stuff'

beforeEach(() => {
  apiStore = fakeApiStore({
    requestResult: { data: [], meta: { page: 1 } },
  })
  uiStore = fakeUiStore
  location = {
    search: `?q=${query}`,
    pathname: `/${apiStore.currentUserOrganization.slug}/search?q=${query}`,
  }
  match = {
    path: '/search',
    params: {
      org: apiStore.currentUserOrganization.slug,
    },
  }
  props = { apiStore, uiStore, location, match }

  wrapper = shallow(<SearchPage.wrappedComponent {...props} />)
})

describe('SearchPage', () => {
  it('makes an API call to fetch the search results', () => {
    const { slug } = apiStore.currentUserOrganization
    expect(apiStore.request).toBeCalledWith(
      `organizations/${slug}/search?query=${query}&page=1&`
    )
  })

  it('displays the "no results" message by default', () => {
    expect(
      wrapper
        .find('PageContainer')
        .children()
        .at(0)
        .text()
    ).toContain(`No results found for "${query}".`)
  })

  describe('organization is deactivated', () => {
    beforeEach(() => {
      wrapper.setProps({
        apiStore: {
          currentOrgIsDeactivated: true,
        },
      })
    })

    it('renders the Deactivated component', () => {
      expect(wrapper.equals(<Deactivated />)).toEqual(true)
    })
  })
})
