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

  describe('cancel', () => {
    beforeEach(() => {
      component.setState({
        item: {
          ...item,
          API_updateWithoutSync: jest.fn(),
          can_edit_content: true,
        },
      })
    })
    it('saves the item if you are an editor', () => {
      component.cancel()
      expect(component.state.item.API_updateWithoutSync).toHaveBeenCalled()
      expect(routingStore.goToPath).toHaveBeenCalled
    })
    it('does not route if route = false', () => {
      component.cancel({ route: false })
      expect(component.state.item.API_updateWithoutSync).toHaveBeenCalled()
      expect(routingStore.goToPath).not.toHaveBeenCalled
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
