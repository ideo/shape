import FoamcoreHotEdge from '~/ui/grid/FoamcoreHotEdge'
import v from '~/utils/variables'

let wrapper, props, render, gutter, gridH, gridW

describe('FoamcoreHotEdge', () => {
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      row: 1,
      col: 2,
      top: 300,
      relativeZoomLevel: 1,
      horizontal: true,
    }
    render = (withProps = props) => {
      gutter = v.defaultGridSettings.gutter / props.relativeZoomLevel
      gridH = v.defaultGridSettings.gridH / props.relativeZoomLevel
      gridW = v.defaultGridSettings.gridW / props.relativeZoomLevel
      wrapper = shallow(<FoamcoreHotEdge {...props} {...withProps} />)
    }
    render(props)
  })

  describe('render()', () => {
    it('renders the HotspotLine', () => {
      expect(wrapper.find('HotspotLine').exists()).toBeTruthy()
    })

    describe('horizontal = true', () => {
      beforeEach(() => {
        render({ horizontal: true })
      })

      it('renders the horizontal HotspotLine at the appropriate row', () => {
        const hotspot = wrapper.find('StyledHotspot')
        const top = (gridH + gutter) * (props.row + 1) - gutter
        expect(hotspot.props().top).toEqual(`${top}px`)
        expect(hotspot.props().left).toEqual('0px')
        expect(hotspot.props().width).toEqual('100%')
      })
    })

    describe('horizontal = false', () => {
      beforeEach(() => {
        render({ horizontal: false })
      })

      it('renders the vertical HotspotLine at the appropriate row/col', () => {
        const hotspot = wrapper.find('StyledHotspot')
        const top = (gridH + gutter) * props.row
        const left = (gridW + gutter) * props.col - 14 / props.relativeZoomLevel
        expect(hotspot.props().top).toEqual(`${top}px`)
        expect(hotspot.props().left).toEqual(`${left}px`)
        expect(hotspot.props().width).toEqual(`${gutter}px`)
      })
    })
  })

  describe('onClick()', () => {
    it('should call the passed in function', () => {
      wrapper.find('StyledHotspot').simulate('click')
      expect(props.onClick).toHaveBeenCalled()
    })
  })
})
