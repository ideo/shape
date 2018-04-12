import AlertDialog from '~/ui/global/modals/AlertDialog'

describe('AlertDialog', () => {
  let props, wrapper, component, alert

  beforeEach(() => {
    props = {
      prompt: 'test prompt',
      iconName: 'Close',
      onClose: jest.fn(),
      open: '',
    }
    wrapper = shallow(
      <AlertDialog {...props} />
    )
    component = wrapper.instance()
  })

  it('should render the Dialog', () => {
    alert = wrapper.find('Dialog')
    expect(alert.exists()).toBe(true)
    expect(component.isOpen).toBeFalsy()
  })

  describe('when open', () => {
    it('should set Dialog open prop', () => {
      wrapper.setProps({ ...props, open: 'info' })
      component = wrapper.instance()
      alert = wrapper.find('Dialog')
      expect(component.isOpen).toBeTruthy()
      expect(alert.props().open).toBe(true)
    })
  })
})
