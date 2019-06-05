import GridCardEmptyHotspot from '~/ui/grid/GridCardEmptyHotspot'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, component, props, uiStore, shallowRender
describe('GridCardEmptyHotspot', () => {
  beforeEach(() => {
    const emptyCard = {
      id: 'empty',
      cardType: 'empty',
      width: 1,
      height: 1,
      order: 5,
    }

    uiStore = fakeUiStore
    props = {
      card: emptyCard,
      uiStore,
    }
    shallowRender = (withProps = props) => {
      wrapper = shallow(
        <GridCardEmptyHotspot.wrappedComponent {...withProps} />
      )
      component = wrapper.instance()
    }
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders a PlusIcon', () => {
    shallowRender(props)
    expect(wrapper.find('PlusIcon').exists()).toBeTruthy()
  })

  it('calls uiStore.openBlankContentTool with card.order on click', () => {
    shallowRender(props)
    component.onClickHotspot()
    expect(uiStore.openBlankContentTool).toHaveBeenCalledWith({
      order: props.card.order,
    })
  })
})
