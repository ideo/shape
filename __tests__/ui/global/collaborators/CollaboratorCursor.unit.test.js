import CollaboratorCursor from '~/ui/global/collaborators/CollaboratorCursor'
import CursorIcon from '~/ui/icons/CursorIcon'

const props = {
  coordinates: { x: 10, y: 20 },
  color: '#bbb',
  name: 'Billy',
}

let wrapper
const rerender = () => {
  wrapper = shallow(<CollaboratorCursor {...props} />)
}

describe('CollaboratorCursorsLayer', () => {
  beforeEach(() => {
    rerender()
  })

  it('renders a CursorIcon', () => {
    expect(wrapper.find(CursorIcon).exists()).toBe(true)
  })

  it('renders a CollaboratorLabelContainer', () => {
    expect(wrapper.find('CollaboratorLabelContainer').exists()).toBe(true)
  })
})
