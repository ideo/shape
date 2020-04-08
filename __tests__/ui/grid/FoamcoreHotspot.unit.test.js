import FoamcoreHotspot from '~/ui/grid/FoamcoreHotspot'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, uiStore, render

describe('FoamcoreHotspot', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    props = {
      onClick: jest.fn(),
      row: 1,
      top: 300,
      uiStore,
    }
    render = (withProps = props) => {
      wrapper = shallow(<FoamcoreHotspot.wrappedComponent {...withProps} />)
    }
    render(props)
  })

  describe('render()', () => {
    it('renders the icon', () => {
      expect(wrapper.find('HotspotLine').exists()).toBeTruthy()
    })
  })

  describe('onClick()', () => {
    it('should call the passed in function', () => {
      wrapper.find('StyledHotspot').simulate('click')
      expect(props.onClick).toHaveBeenCalled()
    })
  })
})
