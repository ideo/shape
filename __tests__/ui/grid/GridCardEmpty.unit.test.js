import GridCardEmpty from '~/ui/grid/GridCardEmpty'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, component, props, apiStore, uiStore, shallowRender
describe('GridCardEmpty', () => {
  beforeEach(() => {
    const emptyCard = {
      id: 'empty',
      cardType: 'empty',
      width: 1,
      height: 1,
      order: 5,
    }
    apiStore = fakeApiStore()
    uiStore = fakeUiStore

    props = {
      card: emptyCard,
      showHotspot: true,
      dragging: false,
      uiStore,
      apiStore,
    }
    shallowRender = (withProps = props) => {
      wrapper = shallow(<GridCardEmpty.wrappedComponent {...withProps} />)
      component = wrapper.instance()
    }
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders a hotspot if showHotspot is true', () => {
    shallowRender({ ...props, showHotspot: true })
    expect(wrapper.find('GridCardHotspot').exists()).toBeTruthy()
  })

  it('does not render a hotspot if showHotspot is false', () => {
    shallowRender({ ...props, showHotspot: false })
    expect(wrapper.find('GridCardHotspot').exists()).toBeFalsy()
  })

  it('renders a hotspot helper if apiStore.currentUser.show_helper is true', () => {
    apiStore.currentUser.show_helper = true
    shallowRender({ ...props, apiStore })
    expect(wrapper.find('HotspotHelperGraphic').exists()).toBeTruthy()
  })

  it('does not render a hotspot helper if apiStore.currentUser.show_helper is false', () => {
    apiStore.currentUser.show_helper = false
    shallowRender({ ...props, apiStore })
    expect(wrapper.find('HotspotHelperGraphic').exists()).toBeFalsy()
  })

  it('does not render a hotspot helper if uiStore.blankContentToolIsOpen is true', () => {
    uiStore.blankContentToolIsOpen = true
    shallowRender({ ...props, uiStore })
    expect(wrapper.find('HotspotHelperGraphic').exists()).toBeFalsy()
  })

  it('calls API_hideHelper when closing the helper', () => {
    shallowRender()
    component.hideHelper()
    expect(apiStore.currentUser.show_helper).toBeFalsy()
    expect(apiStore.currentUser.API_hideHelper).toHaveBeenCalled()
  })
})
