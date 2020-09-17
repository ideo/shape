import DropzoneHolder from '~/ui/grid/dropzone/DropzoneHolder'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, rerender, component
describe('DropzoneHolder', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      handleDragLeave: jest.fn(),
      handleDrop: jest.fn(),
      handleAfterSuccess: jest.fn(),
      willUpload: true,
      didUpload: false,
    }
    rerender = props => {
      wrapper = shallow(<DropzoneHolder {...props} />)
      component = wrapper.instance()
      component.createDropPane = jest.fn()
    }
  })

  it('should render DropzoneHolder', () => {
    rerender(props)
    expect(wrapper.find('DropzoneHolder').exists()).toBe(true)
  })

  it('should render CloudIcon', () => {
    expect(wrapper.find('CloudIcon').exists()).toBe(true)
  })

  describe('componentDidUpdate', () => {
    beforeEach(() => {
      props.willUpload = false
      rerender(props)
    })

    it('should call createDropPane', () => {
      wrapper.setProps({ willUpload: true })
      expect(component.createDropPane).toHaveBeenCalled()
    })
  })
})
