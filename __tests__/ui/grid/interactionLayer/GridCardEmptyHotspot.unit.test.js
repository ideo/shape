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
      handleInsertRowClick: jest.fn(),
      handleRemoveRowClick: jest.fn(),
      onCloseHtc: jest.fn(),
      onCreateContent: jest.fn(),
      zoomLevel: 1,
      uiStore,
    }
    rerender = (withProps = props) => {
      wrapper = shallow(
        <GridCardEmptyHotspot.wrappedComponent {...withProps} />
      )
    }
  })

  it('renders a HotCell', () => {
    rerender(props)
    expect(wrapper.find('HotCell').exists()).toBeTruthy()
  })

  describe('using touch device', () => {
    beforeEach(() => {
      props.uiStore.isTouchDevice = true
      rerender({
        ...props,
      })
    })

    it('should have a modified blank card for empty rows', () => {
      expect(wrapper.find('HotCell').exists()).toBeTruthy()
    })
  })
})
