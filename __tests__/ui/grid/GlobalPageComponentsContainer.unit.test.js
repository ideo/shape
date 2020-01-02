import GlobalPageComponentsContainer from '~/ui/grid/GlobalPageComponentsContainer'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import MoveSnackbar from '~/ui/grid/MoveSnackbar'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper
const uiStore = fakeUiStore

const rerender = () => {
  wrapper = shallow(
    <GlobalPageComponentsContainer.wrappedComponent {...props} />
  )
}

describe('GlobalPageComponentsContainer', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
      uiStore,
    }
    props.apiStore.request = jest.fn()
    props.uiStore.alert.mockClear()
    props.uiStore.scrollToTop.mockClear()
    props.uiStore.shouldOpenMoveSnackbar = true
    rerender()
  })
  describe('moveHelper', () => {
    describe('with template helper', () => {
      beforeEach(() => {
        props.apiStore.currentUser.show_template_helper = true
        props.uiStore.showTemplateHelperForCollection = true
        rerender()
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
        })
        it('should display if user.show_move_helper is true', () => {
          props.uiStore.dismissedMoveHelper = false
          rerender()
          expect(wrapper.find(MoveHelperModal).exists()).toBeTruthy()
        })

        it('should not display if dismissedMoveHelper is true', () => {
          props.uiStore.dismissedMoveHelper = true
          rerender()
          expect(wrapper.find(MoveHelperModal).exists()).toBeFalsy()
        })
      })
    })
  })
})
