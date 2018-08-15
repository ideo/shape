import ItemPage from '~/ui/pages/ItemPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeTextItem } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

let wrapper, match, apiStore, component
let props
const item = fakeTextItem
const uiStore = fakeUiStore
const routingStore = fakeRoutingStore
const { id } = item

beforeEach(() => {
  apiStore = fakeApiStore({
    findResult: item,
    requestResult: { data: item },
  })
  match = { params: { id, org: apiStore.currentOrgSlug }, path: `/items/${id}`, url: `/items/${id}` }
  apiStore.items = [item]
  props = {
    apiStore,
    uiStore,
    routingStore,
    match,
    location: { search: '' },
  }

  wrapper = shallow(
    <ItemPage.wrappedComponent {...props} />
  )
  component = wrapper.instance()
})

describe('ItemPage', () => {
  it('makes an API call to fetch the item', () => {
    expect(apiStore.request).toBeCalledWith(`items/${match.params.id}`)
  })

  it('sets the item in state', () => {
    expect(component.state.item).toEqual(item)
  })

  it('renders the ItemPageContainer', () => {
    expect(wrapper.find('ItemPageContainer').exists()).toEqual(true)
  })

  describe('updateItemName', () => {
    beforeEach(() => {
      wrapper.instance().updateItemName('puppy')
    })

    it('should update the item with the name passed in', () => {
      expect(item.name).toEqual('puppy')
    })

    it('should track an event for updating an item', () => {
      expect(uiStore.trackEvent).toHaveBeenCalledWith('update', item)
    })
  })

  describe('with params ?open=comments', () => {
    beforeEach(() => {
      wrapper = shallow(
        <ItemPage.wrappedComponent {...props} location={{ search: '?open=comments' }} />
      )
    })

    it('should call uiStore to open the comments', () => {
      expect(uiStore.openOptionalMenus).toHaveBeenCalledWith('?open=comments')
    })
  })
})
