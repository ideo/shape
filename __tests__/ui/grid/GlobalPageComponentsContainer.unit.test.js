import GlobalPageComponentsContainer from '~/ui/grid/GlobalPageComponentsContainer'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import MoveSnackbar from '~/ui/grid/MoveSnackbar'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper
const uiStore = fakeUiStore
describe('GlobalPageComponentsContainer', () => {
  beforeEach(() => {
    uiStore.viewingCollection = {
      id: 3,
      API_fetchCards: jest.fn(),
      movingCardIds: [10],
    }
    props = {
      apiStore: fakeApiStore(),
      uiStore,
    }
    props.apiStore.request = jest.fn()
    props.uiStore.alert.mockClear()
    props.uiStore.scrollToTop.mockClear()
    props.uiStore.shouldOpenMoveSnackbar = true
    wrapper = shallow(
      <GlobalPageComponentsContainer.wrappedComponent {...props} />
    )
  })
  describe('moveHelper', () => {
    describe('with template helper', () => {
      beforeEach(() => {
        props.apiStore.currentUser.show_template_helper = true
        props.uiStore.showTemplateHelperForCollection = true
        wrapper = shallow(
          <GlobalPageComponentsContainer.wrappedComponent {...props} />
        )
      })
      it('should display if user.show_template_helper is true', () => {
        expect(wrapper.find(MoveHelperModal).exists()).toBeTruthy()
      })
    })

    describe('with dismissedMoveHelper = true', () => {
      beforeEach(() => {
        props.uiStore.dismissedMoveHelper = true
      })
      it('should not display any helper', () => {
        expect(wrapper.find(MoveHelperModal).exists()).toBeFalsy()
      })
    })

    describe('with moveSnackbar', () => {
      beforeEach(() => {
        props.uiStore.shouldOpenMoveSnackbar = true
      })
      it('should display moveSnackbar', () => {
        expect(wrapper.find(MoveSnackbar).exists()).toBeTruthy()
      })

      describe('with move (MDL) helper', () => {
        beforeEach(() => {
          props.apiStore.currentUser.show_move_helper = true
          props.uiStore.cardAction = 'move'
          wrapper = shallow(
            <GlobalPageComponentsContainer.wrappedComponent {...props} />
          )
        })
        it('should display if user.show_move_helper is true', () => {
          expect(wrapper.find(MoveHelperModal).exists()).toBeTruthy()
        })
      })
    })
  })
})
