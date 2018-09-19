import GroupModify from '~/ui/groups/GroupModify'

describe('GroupModify', () => {
  let apiStore
  let props
  let wrapper
  let component

  beforeEach(() => {
    apiStore = {
      fetch: jest.fn().mockReturnValue(Promise.resolve()),
      request: jest.fn(),
      currentUser: {
        groups: [],
      },
    }
    props = {
      group: {
        assign: jest.fn(),
      },
      onSave: jest.fn(),
      onGroupRoles: jest.fn(),
      apiStore,
    }
    wrapper = shallow(<GroupModify {...props} />)
    component = wrapper.instance()
  })

  describe('constructor', () => {
    describe('with an uncreated group', () => {
      it('should set all the editingGroup attrs to empty strings', () => {
        expect(component.editingGroup.name).toEqual('')
        expect(component.editingGroup.handle).toEqual('')
        expect(component.editingGroup.filestack_file_url).toEqual('')
      })

      it('should set syncing to true', () => {
        expect(component.syncing).toBeTruthy()
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
        wrapper = shallow(<GroupModify {...props} />)
        component = wrapper.instance()
      })

      it('should should copy the existing group attrs to editingGroup', () => {
        expect(component.editingGroup.name).toEqual('tester')
        expect(component.editingGroup.handle).toEqual('test-er')
        expect(component.editingGroup.filestack_file_url).toEqual('test.jpg')
      })

      it('should set syncing to false', () => {
        expect(component.syncing).toBeFalsy()
      })
    })
  })

  describe('handleHandleChange', () => {
    describe('with an uncreated group', () => {
      it('should set syncing to false', () => {
        component.handleHandleChange({ target: { value: 'a' } })
        expect(component.syncing).toBeFalsy()
      })
    })
  })

  describe('handleNameChange', () => {
    describe('with an uncreated group', () => {
      it('should set the handle with a name', () => {
        const name = 'hello'
        component.handleNameChange({ target: { value: name } })
        expect(component.editingGroup.handle).toEqual(name)
      })

      it('should should transform the name to be a handle', () => {
        const name = 'hello world!'
        component.handleNameChange({ target: { value: name } })
        expect(component.editingGroup.handle).toEqual('hello-world')
      })
    })
  })

  describe('handleSave', () => {
    const fakeEvent = { preventDefault: jest.fn() }

    beforeEach(() => {
      component.handleSave(fakeEvent)
    })

    it('should call the onSave prop', () => {
      expect(props.onSave).toHaveBeenCalled()
    })
  })
})
