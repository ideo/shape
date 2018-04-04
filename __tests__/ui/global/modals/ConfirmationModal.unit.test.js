import ConfirmationModal from '~/ui/global/modals/ConfirmationModal'

describe('ConfirmationModal', () => {
  const fakeEvent = {
    preventDefault: jest.fn(),
  }
  let props, wrapper, component

  beforeEach(() => {
    props = {
      prompt: 'test prompt',
      onConfirm: jest.fn(),
      iconName: 'CloseIcon',
      confirmText: 'roger',
    }
    wrapper = shallow(
      <ConfirmationModal {...props} />
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
        expect(component.isOpen).toBeTruthy()
        expect(props.onCancel).toHaveBeenCalled()
      })
    })

    describe('without onCancel prop', () => {
      beforeEach(() => {
        props.onCancel = null
        wrapper.setProps(props)
        component.handleCancel(fakeEvent)
      })

      it('it should close the alert modal', () => {
        expect(component.isOpen).toBeFalsy()
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

    it('should close the modal', () => {
      expect(component.isOpen).toBeFalsy()
    })
  })
})
