// import { runInAction } from 'mobx'
import undoStore from '#/mocks/fakeUndoStore'
import uiStore from '#/mocks/fakeUiStore'
import routingStore from '#/mocks/fakeRoutingStore'
import { fakeCollection } from '#/mocks/data'
import ApiStore from '~/stores/ApiStore'
import IdeoSSO from '~/utils/IdeoSSO'

// have to do this to mock the setup of the other stores
jest.mock('../../app/javascript/stores/index')
jest.mock('../../app/javascript/utils/IdeoSSO')

let collection = fakeCollection
const mockFind = (type, id) => {
  return { ...collection, id }
}

let apiStore
describe('ApiStore', () => {
  beforeEach(() => {
    // reset every time
    apiStore = new ApiStore({ routingStore, uiStore, undoStore })
    collection = fakeCollection
    apiStore.find = jest.fn(mockFind)
  })

  describe('#loadCurrentUser', () => {
    let onSuccess
    beforeEach(() => {
      onSuccess = jest.fn()
      apiStore.request = jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: { id: '11' } }))
    })

    it('requests users/me', async () => {
      await apiStore.loadCurrentUser({ onSuccess })
      expect(apiStore.request).toHaveBeenCalledWith('users/me')
      // calls this as long as there was a user id retrieved
      expect(onSuccess).toHaveBeenCalled()
    })

    it('checks IdeoSSO if option is requested', async () => {
      await apiStore.loadCurrentUser({ onSuccess, checkIdeoSSO: true })
      expect(IdeoSSO.getUserInfo).toHaveBeenCalled()
    })

    describe('with IdeoSSO session expired', () => {
      beforeEach(() => {
        IdeoSSO.getUserInfo = jest.fn().mockReturnValue(Promise.reject())
      })
      afterEach(() => {
        IdeoSSO.getUserInfo = jest.fn().mockReturnValue(Promise.resolve())
      })

      it('logs you out and does not call users/me', async () => {
        await apiStore.loadCurrentUser({ onSuccess, checkIdeoSSO: true })
        expect(IdeoSSO.getUserInfo).toHaveBeenCalled()
        expect(IdeoSSO.logout).toHaveBeenCalled()
        expect(apiStore.request).not.toHaveBeenCalled()
      })
    })
  })

  describe('#moveCards', () => {
    let data
    beforeEach(() => {
      data = {
        to_id: '1',
        from_id: '2',
        collection_card_ids: ['1', '2', '3'],
      }
      // mock some functions
      apiStore.request = jest.fn()
    })

    it('should make collection_cards/move API call', async () => {
      await apiStore.moveCards(data)
      expect(apiStore.request).toHaveBeenCalledWith(
        'collection_cards/move',
        'PATCH',
        data
      )
      expect(collection.toJsonApiWithCards).toHaveBeenCalledWith([])
    })

    it('should push the undo action', async () => {
      await apiStore.moveCards(data)
      expect(undoStore.pushUndoAction).toHaveBeenCalledWith({
        apiCall: expect.any(Function),
        message: 'Move undone',
        redirectPath: {
          id: data.from_id,
          type: 'collections',
        },
        redoAction: {
          actionType: 'snackbar',
          apiCall: expect.any(Function),
          message: 'Move redone',
        },
        redoRedirectPath: {
          id: data.to_id,
          type: 'collections',
        },
      })
    })

    describe('when undoing', () => {
      const undoSnapshot = { something: 'xyz' }
      it('should push the undo action', async () => {
        await apiStore.moveCards(data, { undoing: true, undoSnapshot })
        expect(apiStore.request).toHaveBeenCalledWith(
          'collection_cards/move',
          'PATCH',
          data
        )
        expect(apiStore.request).toHaveBeenCalledWith(
          `collections/${data.to_id}`,
          'PATCH',
          { data: undoSnapshot }
        )
        expect(collection.API_fetchCards).toHaveBeenCalled()
      })
    })

    describe('with a board collection', () => {
      beforeEach(() => {
        collection.isBoard = true
      })
      it('should only call toJsonApiWithCards with the indicated card ids', async () => {
        await apiStore.moveCards(data)
        expect(collection.toJsonApiWithCards).toHaveBeenCalledWith(
          data.collection_card_ids
        )
      })
    })
  })
})
