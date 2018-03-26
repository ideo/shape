import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import Group from '~/stores/jsonApi/Group'
import GroupModify from '~/ui/groups/GroupModify'

jest.mock('../../../app/javascript/stores/jsonApi/Group')
let apiStore
let props
let wrapper
let component

function mountComponent() {
  wrapper = mount(
    <Provider apiStore={apiStore}>
      <GroupModify {...props} />
    </Provider>
  )
}

describe('GroupModify', () => {
  beforeEach(() => {
    useStrict(false)
    props = {
      onSave: jest.fn(),
      group: {
        assign: jest.fn(),
      },
      onGroupRoles: jest.fn(),
    }
    apiStore = {
      fetch: jest.fn(),
      request: jest.fn(),
      currentUser: {
        groups: []
      }
    }
    Group.mockClear()
    mountComponent()
    component = wrapper.find('GroupModify')
  })

  describe('constructor', () => {
    describe('with an uncreated group', () => {
      it('should set all the editingGroup attrs to empty strings', () => {
        expect(component.instance().editingGroup.name).toEqual('')
        expect(component.instance().editingGroup.handle).toEqual('')
        expect(component.instance().editingGroup.filestack_file_url).toEqual('')
      })

      it('should set syncing to true', () => {
        expect(component.instance().syncing).toBeTruthy()
      })
    })

    describe('with an existing group to be edited', () => {
      beforeEach(() => {
        props.group = {
          id: 1,
          name: 'tester',
          handle: 'test-er',
          filestack_file_url: 'test.jpg',
          assign: jest.fn(),
        }
        mountComponent()
        component = wrapper.find('GroupModify')
      })

      it('should should copy the existing group attrs to editingGroup', () => {
        expect(component.instance().editingGroup.name).toEqual('tester')
        expect(component.instance().editingGroup.handle).toEqual('test-er')
        expect(component.instance().editingGroup.filestack_file_url)
          .toEqual('test.jpg')
      })

      it('should set syncing to false', () => {
        expect(component.instance().syncing).toBeFalsy()
      })
    })
  })

  describe('handleHandleChange', () => {
    describe('with an uncreated group', () => {
      it('should set syncing to false', () => {
        component.instance().handleHandleChange({ target: { value: 'a' } })
        expect(component.instance().syncing).toBeFalsy()
      })
    })
  })

  describe('handleNameChange', () => {
    describe('with an uncreated group', () => {
      it('should set the handle with a name', () => {
        const name = 'hello'
        component.instance().handleNameChange({ target: { value: name } })
        expect(component.instance().editingGroup.handle).toEqual(name)
      })

      it('should should transform the name to be a handle', () => {
        const name = 'hello world!'
        component.instance().handleNameChange({ target: { value: name } })
        expect(component.instance().editingGroup.handle).toEqual('hello-world')
      })
    })
  })

  describe('afterSave', () => {
    describe('with an uncreated group', () => {
      beforeEach(() => {
        apiStore.currentUser = {
          groups: [{ id: 4 }]
        }
        wrapper.update()
        component.instance().afterSave({ id: 3 })
      })

      it('should fetch the current user again', () => {
        expect(apiStore.fetch).toHaveBeenCalled()
      })
    })

    describe('with an existing group to be edited', () => {
      beforeEach(() => {
        apiStore.currentUser = {
          groups: [{ id: 3 }]
        }
        wrapper.update()
        component.instance().afterSave({ id: 3 })
      })

      it('should not fetch the current user', () => {
        expect(apiStore.fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('handleSave', () => {
    const fakeEvent = { preventDefault: jest.fn() }

    describe('with an uncreated group', () => {
      let saveFn

      beforeEach(() => {
        saveFn = jest.fn().mockReturnValue(Promise.resolve({}))
        Group.mockImplementation(() =>
          ({
            save: saveFn,
            assign: jest.fn(),
          }))
        component.instance().changeName('after name')
        component.instance().changeHandle('after-handle')
        component.instance().changeUrl('after.jpg')
        component.instance().handleSave(fakeEvent)
      })

      it('should create a new group', () => {
        expect(Group).toHaveBeenCalled()
      })

      it('should save the new group', () => {
        expect(saveFn).toHaveBeenCalled()
      })
    })

    describe('with an existing group to be edited', () => {
      beforeEach(() => {
        props.group = observable({
          id: 1,
          name: 'before name',
          handle: 'before-handle',
          filestack_file_url: 'before.jpg',
          save: jest.fn().mockReturnValue(Promise.resolve({})),
          assign: jest.fn(),
        })
        // Have to remount, because of the provider, setProps wouldn't pass the
        // props to the child correctly.
        // Also because of the provider, I couldn't shallow render the
        // wrappedComponent, it wouldn't pass apiStore.
        mountComponent()
        component = wrapper.find('GroupModify')
        component.instance().changeName('after name')
        component.instance().changeHandle('after-handle')
        component.instance().changeUrl('after.jpg')
        component.instance().handleSave(fakeEvent)
      })

      it('should edit the attrs of the existing group with the editing', () => {
        expect(props.group.name).toEqual('after name')
        expect(props.group.handle).toEqual('after-handle')
        expect(props.group.filestack_file_url).toEqual('after.jpg')
      })

      it('should call save on the group', () => {
        expect(props.group.save).toHaveBeenCalled()
      })
    })
  })
})
