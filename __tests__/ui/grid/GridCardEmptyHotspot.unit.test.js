import GridCardEmptyHotspot from '~/ui/grid/hotspot/GridCardEmptyHotspot'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, component, props, uiStore, rerender
describe('GridCardEmptyHotspot', () => {
  beforeEach(() => {
    const emptyCard = {
      id: 'empty',
      cardType: 'empty',
      width: 1,
      height: 1,
      order: 5,
      position: {
        x: 1,
        y: 2,
      },
    }

    uiStore = fakeUiStore
    props = {
      card: emptyCard,
      interactionType: 'hover',
      uiStore,
    }
    rerender = (withProps = props) => {
      wrapper = shallow(
        <GridCardEmptyHotspot.wrappedComponent {...withProps} />
      )
      component = wrapper.instance()
    }
  })

  it('renders a PlusIcon', () => {
    rerender(props)
    expect(wrapper.find('PlusIcon').exists()).toBeTruthy()
  })

  it('calls uiStore.openBlankContentTool with card.order on click', () => {
    rerender(props)
    component.onClickHotspot()
    expect(uiStore.openBlankContentTool).toHaveBeenCalledWith({
      order: props.card.order,
      col: props.card.position.x,
      row: props.card.position.y,
    })
  })

  describe('render blanks with blank rows', () => {
    beforeEach(() => {
      rerender({
        ...props,
        isFourWideBoard: true,
        emptyRow: true,
      })
    })

    it('should have a modified blank card for empty rows', () => {
      expect(wrapper.find('RightBlankActions').exists()).toBe(true)
    })
  })
})
