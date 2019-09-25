import CardMoveService from '~/ui/grid/CardMoveService'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeUser } from '#/mocks/data'

const apiStore = fakeApiStore()
const uiStore = fakeUiStore

uiStore.viewingCollection = {
  id: 3,
  API_fetchCards: jest.fn(),
  movingCardIds: [10],
}

let service
const reinitialize = () => {
  service = new CardMoveService({ apiStore, uiStore })
}
describe('CardMoveService', () => {
  beforeEach(() => {
    reinitialize()
  })

  describe('moveErrors', () => {
    describe('without permission', () => {
      it('should return an error message', () => {
        const message = service.moveErrors({
          viewingCollection: { can_edit_content: false },
          movingFromCollection: {},
          cardAction: '',
        })
        expect(message).toEqual(
          'You only have view access to this collection. Would you like to keep moving the cards?'
        )
      })
    })

    describe('trying to create a template inside another template', () => {
      it('should return an error message', () => {
        const message = service.moveErrors({
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
        const message = service.moveErrors({
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
        const message = service.moveErrors({
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
        uiStore.viewingCollection.can_edit_content = false
        reinitialize()
        service.moveCards('top')
      })

      it('should not make an API request', () => {
        expect(apiStore.request).not.toHaveBeenCalled()
      })

      it('should show a warning', () => {
        expect(uiStore.confirm).toHaveBeenCalled()
      })
    })

    describe('on a collection nested inside itself', () => {
      beforeEach(() => {
        uiStore.viewingCollection.can_edit_content = true
        apiStore.moveCards.mockImplementationOnce(() => Promise.reject('e'))
        reinitialize()
      })

      it('should show an alert dialog on failure', async () => {
        await service.moveCards('top')
        expect(uiStore.alert).toHaveBeenCalledWith(
          'You cannot move a collection within itself.'
        )
      })
    })

    describe('on an editable, different collection', () => {
      beforeEach(() => {
        apiStore.currentUser = fakeUser
        apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        uiStore.movingCardIds = [21, 23]
        uiStore.movingFromCollectionId = 3
        uiStore.cardAction = 'move'
        uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        reinitialize()
      })

      it('should request the api to move the cards', async () => {
        await service.moveCards('beginning')
        expect(apiStore.moveCards).toHaveBeenCalledWith({
          to_id: uiStore.viewingCollection.id,
          from_id: uiStore.movingFromCollectionId,
          collection_card_ids: uiStore.movingCardIds,
          placement: 'beginning',
        })
      })

      it('should close the move menu', async () => {
        await service.moveCards('beginning')
        expect(uiStore.closeMoveMenu).toHaveBeenCalled()
      })

      it('should deselect the cards and scroll to top', async () => {
        await service.moveCards('beginning')
        expect(uiStore.resetSelectionAndBCT).toHaveBeenCalled()
        expect(uiStore.scrollToTop).toHaveBeenCalled()
      })
    })

    describe('using link action on an editable collection', () => {
      beforeEach(() => {
        apiStore.currentUser = fakeUser
        apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        uiStore.movingCardIds = [21, 23]
        uiStore.movingFromCollectionId = 3
        uiStore.cardAction = 'link'
        uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        reinitialize()
      })

      it('should request the api to link the cards', async () => {
        await service.moveCards('beginning')
        expect(apiStore.linkCards).toHaveBeenCalledWith({
          to_id: uiStore.viewingCollection.id,
          from_id: uiStore.movingFromCollectionId,
          collection_card_ids: uiStore.movingCardIds,
          placement: 'beginning',
        })
      })

      it('should close the move menu', async () => {
        await service.moveCards('beginning')
        expect(uiStore.closeMoveMenu).toHaveBeenCalled()
      })

      it('should deselect the cards', async () => {
        await service.moveCards('beginning')
        expect(uiStore.resetSelectionAndBCT).toHaveBeenCalled()
      })
    })

    describe('creating a template', () => {
      beforeEach(() => {
        apiStore.currentUser = fakeUser
        apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        uiStore.movingFromCollectionId = 3
        uiStore.cardAction = 'useTemplate'
        uiStore.viewingCollection = {
          ...uiStore.viewingCollection,
          id: 4,
          can_edit_content: true,
        }
        reinitialize()
      })

      it('should request the api to create the template', async () => {
        await service.moveCards('beginning')
        expect(apiStore.createTemplateInstance).toHaveBeenCalledWith({
          parent_id: uiStore.viewingCollection.id,
          template_id: uiStore.movingFromCollectionId,
          placement: 'beginning',
        })
        // expect the collection to reload
        expect(uiStore.viewingCollection.API_fetchCards).toHaveBeenCalled()
      })

      it('should show a success message', () => {
        expect(uiStore.popupSnackbar).toHaveBeenCalledWith({
          message: 'Your template instance has been created!',
        })
      })

      it('should close the move menu', async () => {
        await service.moveCards('beginning')
        expect(uiStore.closeMoveMenu).toHaveBeenCalled()
      })
    })
  })
})
