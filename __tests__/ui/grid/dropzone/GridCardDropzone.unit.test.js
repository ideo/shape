import GridCardDropzone from '~/ui/grid/dropzone/GridCardDropzone'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'

let wrapper, props, rerender
describe('GridCardDropzone', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      collection: fakeCollection,
    }

    rerender = props => {
      wrapper = shallow(<GridCardDropzone.wrappedComponent {...props} />)
    }
  })

  it('should render GridCardDropzone', () => {
    rerender(props)
    expect(wrapper.find('GridCardDropzone').exists()).toBe(true)
  })

  describe('with showDropzoneIcon = true', () => {
    beforeEach(() => {
      props.showDropzoneIcon = true
      rerender(props)
    })
    it('should render CloudIcon', () => {
      expect(wrapper.find('CloudIcon').exists()).toBe(true)
    })
  })
})
