import PageMenu from '~/ui/pages/shared/PageMenu'
import {
  fakeCollection
} from '#/mocks/data'

const props = {
  record: fakeCollection,
  menuOpen: false,
}

// const fakeMouseEvent = { stopPropagation: jest.fn() }

let wrapper, actions
describe('PageMenu', () => {
  beforeEach(() => {
    actions = [
      'Tags',
      'Permissions',
      'Archive'
    ]
    wrapper = shallow(
      <PageMenu {...props} />
    )
  })

  it('creates a PopoutMenu with all editable actions', () => {
    const popout = wrapper.find('PopoutMenu').at(0)
    expect(popout.props().menuItems.length).toEqual(actions.length)
  })

  it('allows permissions option to be disabled', () => {
    wrapper = shallow(
      <PageMenu {...props} disablePermissions />
    )
    const popout = wrapper.find('PopoutMenu').at(0)
    expect(popout.props().menuItems.length).toEqual(actions.length - 1)
  })

  it('calls archive on the record', () => {
    wrapper.instance().archiveRecord()
    expect(props.record.API_archive).toHaveBeenCalled()
  })
})
