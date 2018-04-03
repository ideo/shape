import ConfirmationModal from '~/ui/global/modals/ConfirmationModal'

import fakeUiStore from '#/mocks/fakeUiStore'

const uiStore = fakeUiStore

describe('ConfirmationModal', () => {
  const fakeEvent = {
    preventDefault: jest.fn(),
  }
  let props, wrapper, component

  beforeEach(() => {
    props = {
      prompt: 'test prompt',
      onConfirm: jest.fn(),
      icon: <div />,
      confirmText: 'roger',
      uiStore,
    }
    wrapper = shallow(
      <ConfirmationModal.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('handleCancel', () => {
    describe('with onCancel prop', () => {
      beforeEach(() => {
        props.onCancel = jest.fn()
        wrapper.setProps(props)
        component.handleCancel(fakeEvent)
      })

      it('it should run the onCancel prop if it exists', () => {
        expect(props.uiStore.closeAlertModal).not.toHaveBeenCalled()
        expect(props.onCancel).toHaveBeenCalled()
      })
    })

    describe('without onCancel prop', () => {
      beforeEach(() => {
        props.onCancel = null
        wrapper.setProps(props)
        component.handleCancel(fakeEvent)
      })

      it('it should cancel the alert modal in the UI Store', () => {
        expect(props.uiStore.closeAlertModal).toHaveBeenCalled()
      })
    })
  })

  describe('handleConfirm', () => {
    beforeEach(() => {
      component.handleConfirm(fakeEvent)
    })

    it('should call props onConfirm', () => {
      expect(props.onConfirm).toHaveBeenCalled()
    })

    it('should close the modal in the UI store', () => {
      expect(props.uiStore.closeAlertModal).toHaveBeenCalled()
    })
  })
})
