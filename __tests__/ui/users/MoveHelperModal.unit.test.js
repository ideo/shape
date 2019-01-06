import MoveHelperModal from '~/ui/users/MoveHelperModal'
import { fakeUser } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component

describe('MoveHelperModal', () => {
  beforeEach(() => {
    const uiStore = fakeUiStore
    fakeUser.show_move_helper = true
    props = {
      currentUser: fakeUser,
      type: 'move',
      uiStore,
    }
    wrapper = shallow(<MoveHelperModal.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('handleSubmit', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    beforeEach(() => {
      component.handleSubmit(fakeEvent)
    })

    it('should set submitted to true', () => {
      expect(component.submitted).toBe(true)
    })

    describe('after checking the dont show again box', () => {
      beforeEach(() => {
        component.dontShowChecked = true
        component.handleSubmit(fakeEvent)
      })

      it('should update the current user', () => {
        expect(props.currentUser.API_hideHelper).toHaveBeenCalledWith('move')
      })
    })
  })

  describe('render', () => {
    describe('when submitted', () => {
      beforeEach(() => {
        component.submitted = true
        wrapper.update()
      })

      it('should not show the modal', () => {
        const modal = wrapper.find('StyledDialog')
        expect(modal.props().open).toBe(false)
      })
    })
  })
})
