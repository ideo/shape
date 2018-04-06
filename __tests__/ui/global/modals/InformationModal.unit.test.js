import InformationModal from '~/ui/global/modals/InformationModal'

describe('InformationModal', () => {
  let props, wrapper, component, alert

  beforeEach(() => {
    props = {
      prompt: 'test prompt',
      iconName: 'Close',
      onClose: jest.fn(),
      open: '',
    }
    wrapper = shallow(
      <InformationModal {...props} />
    )
    component = wrapper.instance()
  })

  it('should render the AlertModal', () => {
    alert = wrapper.find('AlertModal')
    expect(alert.exists()).toBe(true)
    expect(component.isOpen).toBeFalsy()
  })

  describe('when open', () => {
    it('should set AlertModal open prop', () => {
      wrapper.setProps({ ...props, open: 'info' })
      component = wrapper.instance()
      alert = wrapper.find('AlertModal')
      expect(component.isOpen).toBeTruthy()
      expect(alert.props().open).toBe(true)
    })
  })
})
