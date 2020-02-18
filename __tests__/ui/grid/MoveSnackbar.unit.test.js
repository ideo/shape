import MoveSnackbar from '~/ui/grid/MoveSnackbar'
import { fakeCollection, fakeItemCard } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
const uiStore = fakeUiStore
describe('MoveSnackbar', () => {
  beforeEach(() => {
    uiStore.viewingCollection = {
      id: 3,
      API_fetchCards: jest.fn(),
      movingCardIds: [10],
    }
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeCollection },
        findResult: fakeItemCard,
      }),
      uiStore,
    }
    props.apiStore.request = jest.fn()
    props.uiStore.alert.mockClear()
    props.uiStore.scrollToTop.mockClear()
    props.uiStore.shouldOpenMoveSnackbar = true
    wrapper = shallow(<MoveSnackbar.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('handleClose', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    it('should close the move menu in the uiStore', () => {
      component.handleClose(fakeEvent)
      expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
    })
  })

  describe('with shouldOpenMoveSnackbar = false', () => {
    beforeEach(() => {
      props.uiStore.shouldOpenMoveSnackbar = false
      wrapper = shallow(<MoveSnackbar.wrappedComponent {...props} />)
      component = wrapper.instance()
    })

    it('should not render anything', () => {
      expect(wrapper.find('div').length).toEqual(0)
    })
  })
})
