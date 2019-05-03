import FoamcoreZoomControls from '~/ui/grid/FoamcoreZoomControls'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

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
    expectTreeToMatchSnapshot(wrapper)
  })
})
