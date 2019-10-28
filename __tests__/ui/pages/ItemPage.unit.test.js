import ItemPage from '~/ui/pages/ItemPage'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeTextItem } from '#/mocks/data'

let wrapper, apiStore, component
let props
const item = fakeTextItem
const uiStore = fakeUiStore
const routingStore = fakeRoutingStore

beforeEach(() => {
  apiStore = fakeApiStore({
    findResult: item,
    requestResult: { data: item },
  })
  props = {
    apiStore,
    uiStore,
    routingStore,
    item,
  }

  wrapper = shallow(<ItemPage.wrappedComponent {...props} />)
  component = wrapper.instance()
})

describe('ItemPage', () => {
  it('sets the item in state', () => {
    expect(component.state.item).toEqual(item)
  })

  it('renders the ItemPageContainer', () => {
    expect(wrapper.find('ItemPageContainer').exists()).toEqual(true)
  })

  describe('cancel', () => {
    beforeEach(() => {
      item.API_updateWithoutSync = jest.fn()
      routingStore.goToPath.mockClear()
    })

    it('saves the item if you are an editor', () => {
      component.cancel({
        item: { ...item, can_edit_content: true },
      })
      expect(item.API_updateWithoutSync).toHaveBeenCalled()
      expect(routingStore.goToPath).toHaveBeenCalled()
    })
    it('does not route if route = false', () => {
      expect(routingStore.goToPath).not.toHaveBeenCalled()
    })
    it('does not save unless item.can_edit_content', () => {
      component.cancel({ item })
      expect(item.API_updateWithoutSync).not.toHaveBeenCalled()
    })
  })

  describe('with params ?open=comments', () => {
    beforeEach(() => {
      wrapper = shallow(
        <ItemPage.wrappedComponent
          {...props}
          routingStore={{
            ...routingStore,
            query: '?open=comments',
          }}
        />
      )
    })

    it('should call uiStore to open the comments', () => {
      expect(uiStore.openOptionalMenus).toHaveBeenCalledWith('?open=comments')
    })
  })

  describe('with actionAfterRoute', () => {
    beforeEach(() => {
      wrapper = shallow(
        <ItemPage.wrappedComponent
          {...props}
          uiStore={{
            ...uiStore,
            actionAfterRoute: () => 'do something',
          }}
        />
      )
    })

    it('should call uiStore to perform the action', () => {
      expect(uiStore.performActionAfterRoute).toHaveBeenCalled()
    })
  })
})
