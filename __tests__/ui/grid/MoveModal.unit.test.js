import MoveModal from '~/ui/grid/MoveModal'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import { fakeCollection, fakeItemCard } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
const uiStore = fakeUiStore
describe('MoveModal', () => {
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
    wrapper = shallow(<MoveModal.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
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

  describe('moveHelper', () => {
    describe('template helper', () => {
      beforeEach(() => {
        props.apiStore.currentUser.show_template_helper = true
        props.uiStore.cardAction = 'useTemplate'
        wrapper = shallow(<MoveModal.wrappedComponent {...props} />)
      })
      it('should display if the user should see the template helper', () => {
        expect(wrapper.find(MoveHelperModal).exists()).toBeTruthy()
      })
    })
    describe('move helper', () => {
      beforeEach(() => {
        props.apiStore.currentUser.show_move_helper = true
        props.uiStore.cardAction = 'move'
        wrapper = shallow(<MoveModal.wrappedComponent {...props} />)
      })
      it('should display if the user should see the move helper', () => {
        expect(wrapper.find(MoveHelperModal).exists()).toBeTruthy()
      })
    })

    describe('dismissed helper', () => {
      beforeEach(() => {
        props.uiStore.dismissedMoveHelper = true
      })
      it('should not display the helper', () => {
        expect(wrapper.find(MoveHelperModal).exists()).toBeFalsy()
      })
    })
  })
})
