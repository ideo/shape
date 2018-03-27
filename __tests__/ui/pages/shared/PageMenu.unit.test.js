import PageMenu from '~/ui/pages/shared/PageMenu'
import {
  fakeCollection
} from '#/mocks/data'

const props = {
  record: fakeCollection,
  menuOpen: false,
  canEdit: true,
}

// const fakeMouseEvent = { stopPropagation: jest.fn() }

let wrapper, actions, readOnlyActions
describe('PageMenu', () => {
  beforeEach(() => {
    actions = [
      'Tags',
      'Permissions',
      'Archive'
    ]
    readOnlyActions = [
      'Tags',
      'Permissions',
    ]
    wrapper = shallow(
      <PageMenu {...props} />
    )
  })

  it('creates a PopoutMenu with all editable actions when canEdit', () => {
    const popout = wrapper.find('PopoutMenu').at(0)
    expect(popout.props().menuItems.length).toEqual(actions.length)
  })

  it('creates a PopoutMenu with all read-only actions when canEdit==false', () => {
    const readOnlyProps = {
      ...props,
      canEdit: false
    }
    wrapper = shallow(
      <PageMenu {...readOnlyProps} />
    )
    const popout = wrapper.find('PopoutMenu').at(0)
    expect(popout.props().menuItems.length).toEqual(readOnlyActions.length)
  })

  it('calls archive on the record', () => {
    wrapper.instance().archiveRecord()
    expect(props.record.API_archive).toHaveBeenCalled()
  })
})
