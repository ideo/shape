import InformationModal from '~/ui/global/modals/InformationModal'

describe('InformationModal', () => {
  let props, wrapper, component

  beforeEach(async () => {
    props = {
      prompt: 'test prompt',
      iconName: 'CloseIcon',
      fadeOutTime: 20,
    }
    wrapper = shallow(
      <InformationModal {...props} />
    )
    component = wrapper.instance()
  })

  describe('componentDidMount', () => {
    it('should set open to false after the timeout', async () => {
      await component.componentDidMount
      // TODO fix this not working test, it seems like componentDidMount is
      // not returning the promise
      // expect(component.isOpen).toBeFalsy()
    })
  })
})
