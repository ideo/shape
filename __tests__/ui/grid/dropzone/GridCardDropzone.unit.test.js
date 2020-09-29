import GridCardDropzone from '~/ui/grid/dropzone/GridCardDropzone'

let wrapper, props, rerender
describe('GridCardDropzone', () => {
  beforeEach(() => {
    props = {
      exactDropSpot: false,
      didDrop: false,
      droppingFilesCount: 0,
    }

    rerender = props => {
      wrapper = shallow(<GridCardDropzone {...props} />)
    }
    rerender(props)
  })

  it('should render GridCardDropzone', () => {
    expect(wrapper.find('GridCardDropzone').exists()).toBe(true)
  })

  describe('dropped file to the dropzone', () => {
    beforeEach(() => {
      props.exactDropSpot = true
      props.didDrop = true
      props.droppingFilesCount = 2
      rerender(props)
    })
    it('should display uploading text', () => {
      expect(wrapper.find('CloudIcon').exists()).toBe(false)
      expect(wrapper.find('StyledUploadingText').text()).toContain(
        `Uploading 0 of ${props.droppingFilesCount} files`
      )
    })
  })

  describe('hovering over the dropzone', () => {
    beforeEach(() => {
      props.exactDropSpot = true
      props.didDrop = false
      props.droppingFilesCount = 0
      rerender(props)
    })

    it('should display uploading text', () => {
      expect(wrapper.find('CloudIcon').exists()).toBe(true)
      expect(wrapper.find('StyledDisplayText').text()).toContain('Drag & Drop')
    })
  })
})
