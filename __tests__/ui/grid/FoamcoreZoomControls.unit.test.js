import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'

let props, wrapper

describe('FoamcoreZoomControls', () => {
  beforeEach(() => {
    props = {
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
    }
    wrapper = shallow(<FoamcoreZoomControls {...props} />)
  })

  it('renders snapshot', () => {
    expect(wrapper.find('ZoomIconWrapper').exists()).toBe(true)
  })
})
