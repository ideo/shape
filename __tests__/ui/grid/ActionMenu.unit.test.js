import _ from 'lodash'
import ActionMenu from '~/ui/grid/ActionMenu'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

const card = fakeCollectionCard
card.can_move = true
const uiStore = { ...fakeUiStore, viewingCollection: fakeCollection }
const props = {
  card,
  uiStore,
  canEdit: false,
  canReplace: false,
  menuOpen: false,
}

let wrapper, allActions, actions, component
describe('ActionMenu', () => {
  describe('as editor', () => {
    beforeEach(() => {
      allActions = [
        'Duplicate',
        'Move',
        'Link',
        'Add to My Collection',
        'Tags',
        'Permissions',
        'Archive',
        'Replace',
      ]
      actions = _.without(allActions, 'Replace')
      props.card.isPinnedAndLocked = false
      wrapper = shallow(<ActionMenu.wrappedComponent {...props} canEdit />)
      component = wrapper.instance()
      props.uiStore.selectCardId.mockClear()
      props.uiStore.openMoveMenu.mockClear()
    })

    it('creates a PopoutMenu with all editable actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })

    it('creates a PopoutMenu with editable actions including replace if canReplace', () => {
      wrapper = shallow(
        <ActionMenu.wrappedComponent {...props} canReplace canEdit />
      )
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(allActions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(allActions)
    })

    it('calls beginReplacing on replaceCard action', () => {
      wrapper.instance().replaceCard()
      expect(card.beginReplacing).toHaveBeenCalled()
    })

    it('calls selectCardId and openMoveMenu on moveCard action', () => {
      component.moveCard()
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
      expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: props.uiStore.viewingCollection.id,
        cardAction: 'move',
      })
    })

    it('calls selectCardId and openMoveMenu on duplicate action', () => {
      component.duplicateCard()
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
      expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: props.uiStore.viewingCollection.id,
        cardAction: 'duplicate',
      })
    })

    it('calls selectCardId and openMoveMenu on link action', () => {
      component.linkCard()
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
      expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: props.uiStore.viewingCollection.id,
        cardAction: 'link',
      })
    })
  })

  describe('addToMyCollection', () => {
    beforeEach(async () => {
      await component.addToMyCollection()
    })

    it('should close the move menu', () => {
      expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
    })

    it('should call the API to link to my collection', () => {
      expect(card.API_linkToMyCollection).toHaveBeenCalled()
    })
  })

  describe('as content editor with pinned card', () => {
    beforeEach(() => {
      actions = [
        'Duplicate',
        'Link',
        'Add to My Collection',
        'Tags',
        'Permissions',
        'Replace',
      ]
      props.card.isPinnedAndLocked = true
      wrapper = shallow(
        <ActionMenu.wrappedComponent {...props} canEdit canReplace />
      )
    })

    it('creates a PopoutMenu with content editor actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })

  describe('as viewer', () => {
    beforeEach(() => {
      actions = [
        'Duplicate',
        'Link',
        'Add to My Collection',
        'Tags',
        'Permissions',
      ]
      wrapper = shallow(
        <ActionMenu.wrappedComponent
          {...props}
          canEdit={false}
          canReplace={false}
        />
      )
    })

    it('creates a PopoutMenu with all viewer actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })

  describe('as editor of a system required record', () => {
    beforeEach(() => {
      actions = ['Move', 'Link', 'Add to My Collection', 'Permissions']
      props.card.record.system_required = true
      props.card.isPinnedAndLocked = false
      wrapper = shallow(
        <ActionMenu.wrappedComponent {...props} canEdit canReplace={false} />
      )
    })
    afterEach(() => {
      props.card.record.system_required = false
    })

    it('creates a PopoutMenu with Duplicate and Link viewer actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })

  describe('as editor of a record that you cannot move (no editor access to parent)', () => {
    beforeEach(() => {
      actions = [
        'Duplicate',
        'Link',
        'Add to My Collection',
        'Tags',
        'Permissions',
        'Archive',
      ]
      props.card.can_move = false
      props.card.record.name = 'haho'
      wrapper = shallow(
        <ActionMenu.wrappedComponent {...props} canEdit canReplace={false} />
      )
    })
    afterEach(() => {
      props.card.record.name = 'smaho'
      props.card.can_move = true
    })

    it('creates a PopoutMenu without Move action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })

  describe('with a generic file as item', () => {
    beforeEach(() => {
      props.canEdit = true
      props.card.record.isDownloadable = true
      wrapper = shallow(<ActionMenu.wrappedComponent {...props} />)
      component = wrapper.instance()
    })

    it('creates a PopoutMenu with at least download action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(_.map(popout.props().menuItems, i => i.name)).toContain('Download')
    })
  })
})
