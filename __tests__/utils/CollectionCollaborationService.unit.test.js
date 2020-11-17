import CollectionCollaborationService from '~/utils/CollectionCollaborationService'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'

let service, updateData
const collection = fakeCollection
collection.apiStore = fakeApiStore()
collection.uiStore = fakeUiStore
beforeEach(() => {
  service = new CollectionCollaborationService({ collection })
})

describe('CollectionCollaborationService', () => {
  describe('handleReceivedData', () => {
    describe('with collection_cards_attributes', () => {
      it('calls collection.applyRemoteUpdates', () => {
        updateData = { collection_cards_attributes: [{ id: '1' }] }
        service.handleReceivedData(updateData)
        expect(collection.applyRemoteUpdates).toHaveBeenCalledWith(updateData)
      })
    })

    describe('with card_id', () => {
      it('calls collection.API_fetchCard', () => {
        updateData = { card_id: '1' }
        service.handleReceivedData(updateData)
        expect(collection.API_fetchCard).toHaveBeenCalledWith('1')
      })
    })

    describe('with card_ids', () => {
      it('calls collection.API_fetchAndMergeCards', () => {
        updateData = { card_ids: ['1'] }
        service.handleReceivedData(updateData)
        expect(collection.API_fetchAndMergeCards).toHaveBeenCalledWith(['1'])
      })
    })
  })

  describe('setCollaborator', () => {
    let card, current_editor
    beforeEach(() => {
      card = {
        record: fakeCollection,
      }
      current_editor = {}
    })
    describe('when there is no current_editor', () => {
      it('should not set collaborator', () => {
        service.setCollaborator({ card, current_editor })
        expect(fakeCollection.setLatestCollaborator).not.toHaveBeenCalled()
      })
    })
    describe('when there is no current_editor', () => {
      it('calls setLatestCollaborator on card.record', () => {
        current_editor = { id: '1', name: 'Lala' }
        service.setCollaborator({ card, current_editor })
        expect(fakeCollection.setLatestCollaborator).toHaveBeenCalledWith(
          current_editor
        )
      })
    })
  })
})
