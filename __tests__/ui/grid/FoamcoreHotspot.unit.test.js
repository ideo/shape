import FoamcoreHotspot from '~/ui/grid/FoamcoreHotspot'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeCollection } from '#/mocks/data'

let wrapper, props, uiStore, render

describe('FoamcoreHotspot', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    props = {
      collection: fakeCollection,
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
    it('should insert a row into the row passed in', () => {
      wrapper.find('StyledHotspot').simulate('click')
      expect(props.collection.API_insertRow).toHaveBeenCalled()
    })
  })
})
