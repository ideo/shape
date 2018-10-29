import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'

describe('ConfirmationDialog', () => {
  const fakeEvent = {
    preventDefault: jest.fn(),
  }
  let props, wrapper, component, alert

  beforeEach(() => {
    props = {
      prompt: 'test prompt',
      onClose: jest.fn(),
      iconName: 'Close',
      onConfirm: jest.fn(),
      confirmText: 'roger',
    }
    wrapper = shallow(<ConfirmationDialog {...props} />)
    component = wrapper.instance()
  })

  it('should render the Dialog', () => {
    alert = wrapper.find('Dialog')
    expect(alert.exists()).toBe(true)
    expect(component.isOpen).toBeFalsy()
  })

  describe('when open', () => {
    beforeEach(() => {
      props.open = 'confirm'
      wrapper.setProps(props)
    })

    it('should set Dialog open prop', () => {
      component = wrapper.instance()
      alert = wrapper.find('Dialog')
      expect(component.isOpen).toBeTruthy()
      expect(alert.props().open).toBe(true)
    })

    it('should not show snooze warning', () => {
      expect(wrapper.find('snoozeDialogMessage').exists()).toBe(false)
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
          expect(props.onClose).toHaveBeenCalled()
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
        expect(props.onClose).toHaveBeenCalled()
      })
    })

    describe('onToggleSnoozeDialog provided', () => {
      beforeEach(() => {
        props.onToggleSnoozeDialog = jest.fn()
        wrapper.setProps(props)
      })

      it('should show snooze warning', () => {
        expect(wrapper.find('snoozeDialogMessage').exists()).toBe(true)
      })

      it('should call onToggleSnoozeDialog if label clicked', () => {
        wrapper.find('snoozeDialogMessage').simulate('click', fakeEvent)
        expect(props.onToggleSnoozeDialog.mock.calls.length).toBe(1)
      })
    })
  })
})
