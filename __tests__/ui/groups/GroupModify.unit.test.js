import GroupModify from '~/ui/groups/GroupModify'

describe('GroupModify', () => {
  let apiStore, props, wrapper, component, rerender

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
      formDisabled: false,
      groupFormFields: {
        name: '',
        handle: '',
        filestack_file_url: '',
        filestack_file_attributes: null,
      },
      changeGroupFormName: jest.fn(),
      changeGroupFormHandle: jest.fn(),
      changeGroupFormFileAttrs: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<GroupModify {...props} />)
      component = wrapper.instance()
    }
    rerender()
  })

  describe('componentDidMount', () => {
    describe('with an uncreated group', () => {
      it('should set syncing to true', () => {
        expect(component.syncing).toBeTruthy()
      })
    })

    // FIXME: editing existing groups is no longer used
    describe('with an existing group to be edited', () => {
      beforeEach(() => {
        props.group = {
          id: 1,
          name: 'tester',
          handle: 'test-er',
          filestack_file_url: 'test.jpg',
          assign: jest.fn(),
        }
        rerender()
      })

      xit('should set syncing to false', () => {
        expect(component.syncing).toBeFalsy()
      })
    })
  })

  describe('handleHandleChange', () => {
    describe('with an uncreated group', () => {
      beforeEach(() => {
        component.handleHandleChange({ target: { value: 'a' } })
      })

      it('should set syncing to false', () => {
        expect(component.syncing).toBeFalsy()
      })

      it('should call changeGroupFormHandle', () => {
        expect(props.changeGroupFormHandle).toHaveBeenCalled()
      })
    })

    describe('with an invalid handle (starts with a number)', () => {
      it('should disable the form button', () => {
        component.handleHandleChange({ target: { value: '12a' } })
      })
    })
  })

  describe('handleNameChange', () => {
    describe('with an uncreated group', () => {
      it('should set the handle with a name', () => {
        const name = 'hello'
        component.handleNameChange({ target: { value: name } })
        expect(props.changeGroupFormName).toHaveBeenCalled()
      })

      it('should should transform the name to be a handle', () => {
        const name = 'hello world!'
        component.handleNameChange({ target: { value: name } })
        expect(props.changeGroupFormHandle).toHaveBeenCalled()
      })
    })
  })
})
