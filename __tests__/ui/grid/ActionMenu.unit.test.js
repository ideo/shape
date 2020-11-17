import _ from 'lodash'
import ActionMenu from '~/ui/grid/ActionMenu'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

const card = fakeCollectionCard
const uiStore = { ...fakeUiStore, viewingCollection: fakeCollection }
const props = {
  card,
  uiStore,
  canView: true,
  canEdit: false,
  canReplace: false,
  menuOpen: false,
  apiStore: fakeApiStore(),
}

let wrapper, allActions, allBoardActions, actions, component
describe('ActionMenu', () => {
  describe('as editor', () => {
    beforeEach(() => {
      allBoardActions = [
        'Comment',
        'Duplicate',
        'Move',
        'Link',
        'Select All',
        'Select Cards Below',
        'Add to My Collection',
        'Tags',
        'Sharing',
        'Delete',
        'Replace',
      ]
      allActions = _.without(allBoardActions, 'Select Cards Below')
      actions = _.without(allActions, 'Replace')
      props.card.isPinnedAndLocked = false
      props.card.record.can_edit = true
      wrapper = shallow(<ActionMenu.wrappedComponent {...props} canEdit />)
      component = wrapper.instance()
      props.uiStore.reselectOnlyMovableCards.mockClear()
      props.uiStore.reselectOnlyEditableRecords.mockClear()
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

    it('calls collection.confirmEdit on move action', () => {
      component.moveCard()
      expect(props.card.parentCollection.confirmEdit).toHaveBeenCalledWith({
        onConfirm: expect.any(Function),
        onCancel: expect.any(Function),
      })
    })

    describe('assuming confirmEdit warning disabled', () => {
      it('calls selectCardId, reselectOnlyMovableCards and openMoveMenu on move action', () => {
        component.openMoveMenu('move')
        expect(props.uiStore.reselectOnlyMovableCards).toHaveBeenCalled()
        expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
        expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
          from: props.uiStore.viewingCollection,
          cardAction: 'move',
        })
      })
    })

    it('calls selectCardId and openMoveMenu on duplicate action', () => {
      component.duplicateCard()
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
      expect(props.uiStore.reselectWithoutPlaceholders).toHaveBeenCalled()
      expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: props.uiStore.viewingCollection,
        cardAction: 'duplicate',
      })
    })

    it('calls selectCardId and openMoveMenu on link action', () => {
      component.linkCard()
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(card.id)
      expect(props.uiStore.reselectWithoutPlaceholders).toHaveBeenCalled()
      expect(props.uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: props.uiStore.viewingCollection,
        cardAction: 'link',
      })
    })

    it('calls reselectOnlyEditableRecords on showTags action', () => {
      component.showTags()
      expect(props.uiStore.reselectOnlyEditableRecords).toHaveBeenCalled()
      expect(props.uiStore.update).toHaveBeenCalledWith(
        'tagsModalOpenId',
        props.card.id
      )
    })

    describe('on board collection', () => {
      it('adds selectCardsBelow action', () => {
        wrapper = shallow(
          <ActionMenu.wrappedComponent
            {...props}
            uiStore={{
              ...props.uiStore,
              viewingCollection: { isBoard: true },
            }}
            location="GridCard"
            canReplace
            canEdit
          />
        )
        const popout = wrapper.find('PopoutMenu').at(0)
        expect(_.map(popout.props().menuItems, i => i.name)).toEqual(
          allBoardActions
        )
      })
    })
  })

  describe('addToMyCollection', () => {
    beforeEach(async () => {
      await component.addToMyCollection()
    })

    it('should close the move menu', () => {
      expect(props.uiStore.selectCardId).toHaveBeenCalledWith(props.card.id)
      expect(props.uiStore.closeMoveMenu).toHaveBeenCalledWith({
        deselect: false,
      })
    })

    it('should call the API to link to my collection', () => {
      expect(card.API_linkToMyCollection).toHaveBeenCalled()
    })
  })

  describe('as content editor with pinned card', () => {
    beforeEach(() => {
      actions = [
        'Comment',
        'Duplicate',
        'Link',
        'Select All',
        'Add to My Collection',
        'Tags',
        'Sharing',
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
        'Comment',
        'Duplicate',
        'Link',
        'Select All',
        'Add to My Collection',
        'Tags',
        'Sharing',
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

    describe('if cannot view', () => {
      beforeEach(() => {
        props.canView = false
        wrapper = shallow(<ActionMenu.wrappedComponent {...props} />)
      })

      it('does not include Duplicate', () => {
        const actionsWithoutDuplicate = actions.filter(
          val => val !== 'Duplicate'
        )
        const popout = wrapper.find('PopoutMenu').at(0)
        expect(popout.props().menuItems.length).toEqual(
          actionsWithoutDuplicate.length
        )
        expect(_.map(popout.props().menuItems, i => i.name)).toEqual(
          actionsWithoutDuplicate
        )
      })
    })
  })

  describe('as editor of a system required record', () => {
    beforeEach(() => {
      actions = [
        'Comment',
        'Move',
        'Link',
        'Select All',
        'Add to My Collection',
        'Sharing',
      ]
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

  describe('as editor of a record that you can move', () => {
    beforeEach(() => {
      actions = [
        'Comment',
        'Duplicate',
        'Move',
        'Link',
        'Select All',
        'Add to My Collection',
        'Tags',
        'Sharing',
        'Delete',
      ]
      props.card.record.name = 'haho'
      wrapper = shallow(
        <ActionMenu.wrappedComponent {...props} canEdit canReplace={false} />
      )
    })
    afterEach(() => {
      props.card.record.name = 'smaho'
    })

    it('creates a PopoutMenu with Move action', () => {
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

  describe('with an archived record', () => {
    beforeEach(() => {
      actions = ['Comment', 'Select All', 'Download', 'Tags']
      props.canEdit = true
      props.card.record.archived = true
      wrapper = shallow(<ActionMenu.wrappedComponent {...props} />)
    })

    it('should only render limited options', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, 'name')).toEqual(actions)
    })
  })
})
