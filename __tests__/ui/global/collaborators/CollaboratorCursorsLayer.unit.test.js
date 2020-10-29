import CollaboratorCursorsLayer from '~/ui/global/collaborators/CollaboratorCursorsLayer'
import fakeUiStore from '#/mocks/fakeUiStore'

const props = {
  uiStore: {
    ...fakeUiStore,
    relativeZoomLevel: 1.5,
    viewingCollection: {
      id: '1',
      collaborators: [
        { id: '1', color: '#fff', name: 'Foo', coordinates: { x: 10, y: 20 } },
        { id: '2', color: '#bbb', name: 'Bar' },
      ],
    },
  },
}

let wrapper, cursor
const rerender = () => {
  wrapper = shallow(<CollaboratorCursorsLayer.wrappedComponent {...props} />)
  cursor = wrapper.find('CollaboratorCursor').at(0)
}

describe('CollaboratorCursorsLayer', () => {
  beforeEach(() => {
    rerender()
  })

  it('renders a cursor for each collaborator with coordinates', () => {
    expect(wrapper.find('CollaboratorCursor').length).toEqual(1)
    expect(cursor.props().color).toEqual('#fff')
  })

  it('factors relativeZoomLevel into the coordinates', () => {
    expect(cursor.props().coordinates).toEqual({
      x: 10 / 1.5,
      y: 20 / 1.5,
    })
  })
})
