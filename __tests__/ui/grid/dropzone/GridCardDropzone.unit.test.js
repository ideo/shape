import GridCardDropzone from '~/ui/grid/dropzone/GridCardDropzone'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection } from '#/mocks/data'

let wrapper, props, rerender, component, apiStore
describe('GridCardDropzone', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    props = {
      apiStore,
      uiStore: fakeUiStore,
      collection: fakeCollection,
    }

    rerender = props => {
      wrapper = shallow(<GridCardDropzone.wrappedComponent {...props} />)
      component = wrapper.instance()
      component.handleDrop = jest.fn()
    }
  })

  it('should render GridCardDropzone', () => {
    rerender(props)
    expect(wrapper.find('GridCardDropzone').exists()).toBe(true)
  })

  it('should render DropzoneHolder', () => {
    rerender(props)
    expect(wrapper.find('DropzoneHolder').exists()).toBe(true)
  })

  describe('onDragOver', () => {
    beforeEach(() => {
      const fakeEv = {
        preventDefault: jest.fn(),
        target: { closest: jest.fn().mockReturnValue(true) },
      }
      component.debouncedWillResetUpload = jest.fn()
      wrapper.find('GridCardDropzone').simulate('dragover', fakeEv)
    })

    it('should create placeholder cards', () => {
      expect(component.debouncedWillResetUpload).toHaveBeenCalled()
    })
  })
})
