import GridCardEmptyHotspot from '~/ui/grid/interactionLayer/GridCardEmptyHotspot'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, uiStore, rerender
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
    }
  })

  it('renders a PlusIcon', () => {
    rerender(props)
    expect(wrapper.find('PlusIcon').exists()).toBeTruthy()
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
