import _ from 'lodash'

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

let wrapper, actions, readOnlyActions, noPermissionActions
describe('PageMenu', () => {
  beforeEach(() => {
    actions = [
      'Duplicate',
      'Tags',
      'Permissions',
      'Archive'
    ]
    readOnlyActions = [
      'Duplicate',
      'Tags',
      'Permissions',
    ]
    noPermissionActions = [
      'Duplicate',
      'Tags',
      'Archive',
    ]
    wrapper = shallow(
      <PageMenu {...props} />
    )
  })

  it('creates a PopoutMenu with all editable actions when canEdit', () => {
    const popout = wrapper.find('PopoutMenu').at(0)
    const menuItemNames = _.map(popout.props().menuItems, 'name')
    expect(menuItemNames).toEqual(actions)
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
    const menuItemNames = _.map(popout.props().menuItems, 'name')
    expect(menuItemNames).toEqual(readOnlyActions)
  })

  it('allows permissions option to be disabled', () => {
    wrapper = shallow(
      <PageMenu {...props} disablePermissions />
    )
    const popout = wrapper.find('PopoutMenu').at(0)
    const menuItemNames = _.map(popout.props().menuItems, 'name')
    expect(menuItemNames).toEqual(noPermissionActions)
  })

  it('calls archive on the record', () => {
    wrapper.instance().archiveRecord()
    expect(props.record.API_archive).toHaveBeenCalled()
  })
})
