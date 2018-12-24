import MoveModal from '~/ui/grid/MoveModal'
import { fakeCollection, fakeUser } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
const uiStore = fakeUiStore
describe('MoveModal', () => {
  beforeEach(() => {
    uiStore.viewingCollection = {
      id: 3,
      API_fetchCards: jest.fn(),
      API_fetchNextCards: jest.fn(),
    }
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeCollection },
      }),
      uiStore,
    }
    props.apiStore.request = jest.fn()
    props.uiStore.alert.mockClear()
    props.uiStore.scroll.scrollToTop.mockClear()
    wrapper = shallow(<MoveModal.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('handleClose', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    it('should close the move menu in the uiStore', () => {
      component.handleClose(fakeEvent)
      expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
    })
  })

  describe('moveErrors', () => {
    describe('without permission', () => {
      it('should return an error message', () => {
        const message = component.moveErrors({
          viewingCollection: { can_edit_content: false },
          movingFromCollection: {},
          cardAction: '',
        })
        expect(message).toEqual(
          "You don't have permission to move items to this collection"
        )
      })
    })

    describe('moving pinned items out of a template', () => {
      it('should return an error message', () => {
        const message = component.moveErrors({
          viewingCollection: {
            isMasterTemplate: false,
            can_edit_content: true,
          },
          movingFromCollection: { isMasterTemplate: true },
          cardAction: 'move',
        })
        expect(message).toEqual(
          "You can't move pinned template items out of a template"
        )
      })
    })
    describe('trying to create a template inside another template', () => {
      it('should return an error message', () => {
        const message = component.moveErrors({
          viewingCollection: {
            id: 1,
            can_edit_content: true,
            isMasterTemplate: true,
          },
          movingFromCollection: { id: 1 },
          cardAction: 'useTemplate',
        })
        expect(message).toContain(
          "You can't create a template instance inside another template"
        )
      })
    })

    describe('with edit access and no issues', () => {
      it('should not return an error message', () => {
        const message = component.moveErrors({
          viewingCollection: { id: 3, can_edit_content: true },
          movingFromCollection: { id: 1 },
          cardAction: 'move',
        })
        expect(message).toBeFalsy()
      })
    })

    describe('when moving into a test collection or design', () => {
      it('should return an error message', () => {
        const viewingCollection = {
          id: 1,
          isTestCollection: true,
          can_edit_content: true,
        }
        const movingFromCollection = { id: 1 }
        const message = component.moveErrors({
          viewingCollection,
          movingFromCollection,
          cardAction: 'move',
        })
        expect(message).toContain("You can't move cards into a test collection")
      })
    })
  })

  describe('moveCards', () => {
    describe('on an uneditable collection', () => {
      beforeEach(() => {
        props.uiStore.viewingCollection.can_edit_content = false
        wrapper.setProps(props)
        component.moveCards('top')
      })

      it('should not make an API request', () => {
        expect(props.apiStore.request).not.toHaveBeenCalled()
      })

      it('should show a warning', () => {
        expect(uiStore.alert).toHaveBeenCalled()
      })
    })

    describe('on a collection nested inside itself', () => {
      beforeEach(() => {
        props.uiStore.viewingCollection.can_edit_content = true
        props.apiStore.moveCards.mockReturnValue(Promise.reject())
        wrapper.setProps(props)
      })

      it('should show an alert dialog on failure', async () => {
        await component.moveCards('top')
        expect(uiStore.alert).toHaveBeenCalledWith(
          'You cannot move a collection within itself.'
        )
      })
    })

    describe('on an editable, different collection', () => {
      beforeEach(() => {
        props.apiStore.currentUser = fakeUser
        props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        props.uiStore.movingCardIds = [21, 23]
        props.uiStore.movingFromCollectionId = 3
        props.uiStore.cardAction = 'move'
        props.uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        wrapper.setProps(props)
        component = wrapper.instance()
      })

      it('should request the api to move the cards', async () => {
        await component.moveCards('beginning')
        expect(props.apiStore.moveCards).toHaveBeenCalledWith({
          to_id: props.uiStore.viewingCollection.id,
          from_id: props.uiStore.movingFromCollectionId,
          collection_card_ids: props.uiStore.movingCardIds,
          placement: 'beginning',
        })
      })

      it('should close the move menu', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
      })

      it('should deselect the cards and scroll to top', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.resetSelectionAndBCT).toHaveBeenCalled()
        expect(props.uiStore.scroll.scrollToTop).toHaveBeenCalled()
      })
    })

    describe('using link action on an editable collection', () => {
      beforeEach(() => {
        props.apiStore.currentUser = fakeUser
        props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        props.uiStore.movingCardIds = [21, 23]
        props.uiStore.movingFromCollectionId = 3
        props.uiStore.cardAction = 'link'
        props.uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        wrapper.setProps(props)
        component = wrapper.instance()
      })

      it('should request the api to link the cards', async () => {
        await component.moveCards('beginning')
        expect(props.apiStore.linkCards).toHaveBeenCalledWith({
          to_id: props.uiStore.viewingCollection.id,
          from_id: props.uiStore.movingFromCollectionId,
          collection_card_ids: props.uiStore.movingCardIds,
          placement: 'beginning',
        })
      })

      it('should close the move menu', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
      })

      it('should deselect the cards', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.resetSelectionAndBCT).toHaveBeenCalled()
      })
    })

    describe('creating a template', () => {
      beforeEach(() => {
        props.apiStore.currentUser = fakeUser
        props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        props.uiStore.movingFromCollectionId = 3
        props.uiStore.cardAction = 'useTemplate'
        props.uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        wrapper.setProps(props)
        component = wrapper.instance()
      })

      it('should request the api to create the template', async () => {
        await component.moveCards('beginning')
        expect(props.apiStore.createTemplateInstance).toHaveBeenCalledWith({
          parent_id: props.uiStore.viewingCollection.id,
          template_id: props.uiStore.movingFromCollectionId,
          placement: 'beginning',
        })
        // expect the collection to reload
        expect(
          props.uiStore.viewingCollection.API_fetchCards
        ).toHaveBeenCalled()
      })

      it('should show a success message', () => {
        expect(uiStore.alertOk).toHaveBeenCalledWith(
          'Your template instance has been created!'
        )
      })

      it('should close the move menu', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
      })
    })
  })
})
