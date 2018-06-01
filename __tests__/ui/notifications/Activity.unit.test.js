import Activity from '~/ui/notifications/Activity'

import {
  fakeActivity,
  fakeUser,
} from '#/mocks/data'

let props
let wrapper
let component

describe('Activity', () => {
  beforeEach(() => {
    props = {
      action: fakeActivity.action,
      actors: [fakeActivity.actor],
      target: fakeActivity.target,
      subjectUsers: fakeActivity.subject_users,
      subjectGroups: fakeActivity.subject_groups,
      actorCount: 1,
    }
    wrapper = shallow(
      <Activity {...props} />
    )
    component = wrapper.instance()
  })

  describe('render', () => {
    function findPart(className) {
      return wrapper.find(`.${className}`)
    }

    describe('with the archived action', () => {
      beforeEach(() => {
        props.action = 'archived'
        props.target = { name: 'Plants', internalType: 'collections' }
        wrapper.setProps(props)
      })

      it('should render the message with actor and target', () => {
        expect(wrapper.find('.actor').text()).toEqual(fakeUser.name)
        expect(findPart('target').props().children).toEqual('Plants')
      })

      it('should not render a link to the target', () => {
        expect(findPart('target').props().to).toBeFalsy()
      })
    })

    describe('with the added role action', () => {
      beforeEach(() => {
        props.action = 'added_member'
        props.subjectUsers = [{ name: 'Bill' }, { name: 'Tom' }]
        props.subjectGroups = [{ name: 'Pokemon' }]
        props.target = { id: 4, name: 'Pokemons', internalType: 'collections' }
        wrapper.setProps(props)
      })

      it('should render with the actor and target', () => {
        expect(findPart('actor').text()).toEqual(fakeUser.name)
      })

      it('should render each subject user and group', () => {
        expect(findPart('subjects').text()).toEqual('Bill, Tom, Pokemon')
      })

      it('should render with the correct role name', () => {
        expect(findPart('roleName').text()).toEqual('member')
      })

      it('should link to the target', () => {
        const link = findPart('target')
        expect(link.props().to).toEqual('/collections/4')
      })
    })

    describe('with a comment', () => {
      beforeEach(() => {
        props.action = 'commented'
        props.content = 'some content'
        props.target = {
          id: 18,
          name: 'Great collection',
          internalType: 'collections',
        }
        wrapper.setProps(props)
      })

      it('should show the actor', () => {
        expect(findPart('actor').text()).toEqual(fakeUser.name)
      })

      it('should have the target', () => {
        expect(findPart('target').props().children).toEqual('Great collection')
      })

      it('should have the message of the last comment', () => {
        expect(findPart('message').text()).toEqual('some content')
      })

      it('should link to the record for the comment thread', () => {
        const link = findPart('target')
        expect(link.props().to).toEqual('/collections/18')
      })
    })

    describe('with multiple actors', () => {
      beforeEach(() => {
        props.actors = [fakeActivity.actor, { id: 200, name: 'Boo' }]
        props.actorCount = 2
        wrapper.setProps(props)
      })

      it('should put a comma between each actor', () => {
        expect(findPart('actor').text()).toEqual(`${fakeUser.name}, Boo`)
      })

      describe('with the same 2 actors', () => {
        beforeEach(() => {
          props.actors = [fakeActivity.actor, fakeActivity.actor]
          props.actorCount = 2
          wrapper.setProps(props)
        })

        it('should just show one actor', () => {
          expect(findPart('actor').text()).toEqual(`${fakeUser.name}`)
        })
      })

      describe('with more then 3 actors', () => {
        beforeEach(() => {
          props.actors = [
            ...props.actors,
            { id: 201, name: 'Lia' },
          ]
          props.actorCount = 5
          wrapper.setProps(props)
          wrapper.update()
        })

        it('should say how many people without individual names', () => {
          expect(findPart('actor').text()).toEqual('5 people')
        })
      })
    })
  })

  describe('isRoleAction', () => {
    it('should return true if any editor or member action', () => {
      props.action = 'added_editor'
      wrapper.setProps(props)
      expect(component.isRoleAction()).toBeTruthy()
    })

    it('should return false for any non editor action', () => {
      props.action = 'archived'
      wrapper.setProps(props)
      expect(component.isRoleAction()).toBeFalsy()
    })
  })
})
