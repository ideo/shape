import ItemPage from '~/ui/pages/ItemPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeTextItem
} from '#/mocks/data'

let wrapper, match, apiStore, component
let props
const item = fakeTextItem
const uiStore = fakeUiStore
const { id } = item

beforeEach(() => {
  match = { params: { id }, path: `/items/${id}`, url: `/items/${id}` }
  apiStore = fakeApiStore({
    findResult: item,
    requestResult: { data: item },
  })
  apiStore.items = [item]
  props = { apiStore, match, uiStore }

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
})
