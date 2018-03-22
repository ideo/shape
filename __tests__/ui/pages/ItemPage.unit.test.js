import ItemPage from '~/ui/pages/ItemPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import {
  fakeTextItem
} from '#/mocks/data'

let wrapper, match, apiStore
let props
const item = fakeTextItem
const { id } = item

beforeEach(() => {
  match = { params: { id }, path: `/items/${id}`, url: `/items/${id}` }
  apiStore = fakeApiStore({
    findResult: item,
    requestResult: { data: item },
  })
  apiStore.items = [item]
  props = { apiStore, match }

  wrapper = shallow(
    <ItemPage.wrappedComponent {...props} />
  )
})

describe('ItemPage', () => {
  it('makes an API call to fetch the item', () => {
    expect(apiStore.request).toBeCalledWith(`items/${match.params.id}`)
    expect(apiStore.find).toBeCalledWith('items', match.params.id)
  })

  it('displays the item name', () => {
    expect(wrapper.find('EditableName').exists()).toEqual(true)
    expect(wrapper.find('EditableName').props().name).toEqual(item.name)
  })
})
