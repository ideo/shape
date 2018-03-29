import _ from 'lodash'
import CardMenu from '~/ui/grid/CardMenu'

const props = {
  card: { id: 123 },
  canEdit: false,
  canReplace: false,
  handleShare: jest.fn(),
  handleDuplicate: jest.fn(),
  handleLink: jest.fn(),
  handleMove: jest.fn(),
  handleArchive: jest.fn(),
  handleReplace: jest.fn(),
  uiStore: {
    openCardMenuId: false,
    update: jest.fn(),
    closeMoveMenu: jest.fn(),
  },
  menuOpen: false,
}

// const fakeMouseEvent = { stopPropagation: jest.fn() }

let wrapper, allActions, actions
describe('CardMenu', () => {
  describe('as editor', () => {
    beforeEach(() => {
      allActions = [
        'Duplicate',
        'Move',
        'Link',
        'Archive',
        'Replace',
      ]
      actions = _.without(allActions, 'Replace')
      props.canEdit = true
      wrapper = shallow(
        <CardMenu {...props} />
      )
    })

    it('creates a PopoutMenu with all editable actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })

    it('creates a PopoutMenu with editable actions including replace if canReplace', () => {
      props.canReplace = true
      wrapper = shallow(
        <CardMenu {...props} />
      )
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(allActions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(allActions)
    })
  })

  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Duplicate']
      props.canEdit = false
      props.canReplace = false
      wrapper = shallow(
        <CardMenu {...props} />
      )
    })

    it('creates a PopoutMenu with only 1 viewer action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(1)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })
})
