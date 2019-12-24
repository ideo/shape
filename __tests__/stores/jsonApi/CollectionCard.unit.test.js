import CollectionCard from '~/stores/jsonApi/CollectionCard'
import fakeApiStore from '#/mocks/fakeApiStore'

const collectionCardAttributes = {
  order: 1,
  height: 1,
  width: 1,
  row: 0,
  col: 1,
  maxWidth: 1,
  maxHeight: 1,
  record: {},
  item: {},
  reference: false,
  image_contain: false,
}

let collectionCard
let apiStore = fakeApiStore()
const { uiStore } = apiStore
beforeEach(() => {
  apiStore.request.mockClear()
  uiStore.addNewCard.mockClear()
  uiStore.reselectCardIds.mockClear()
  collectionCard = new CollectionCard(collectionCardAttributes, apiStore)
})

describe('CollectionCard', () => {
  describe('canMove', () => {
    it('returns true if card is not pinned and you can edit the parent', () => {
      collectionCard.pinned_and_locked = false
      collectionCard.can_edit_parent = true
      expect(collectionCard.canMove).toBeTruthy()
      collectionCard.can_edit_parent = false
      expect(collectionCard.canMove).toBeFalsy()
    })

    it('returns true if card is not pinned and you can edit the record', () => {
      collectionCard.pinned_and_locked = true
      collectionCard.record = { can_edit: true }
      expect(collectionCard.canMove).toBeFalsy()
      collectionCard.pinned_and_locked = false
      expect(collectionCard.canMove).toBeTruthy()
      collectionCard.record = { can_edit: false }
      expect(collectionCard.canMove).toBeFalsy()
    })
  })

  describe('API_create', () => {
    describe('when Link (with no name) or Data item', () => {
      beforeEach(() => {
        const record = { isLink: true, id: 1, url: 'shape.space' }
        const mockParent = { addCard: jest.fn() }
        apiStore = fakeApiStore({
          requestResult: {
            data: { record },
          },
        })
        collectionCard = new CollectionCard(
          { ...collectionCardAttributes, parent: mockParent },
          apiStore
        )
      })
      it('adds new card to the UI Store', async () => {
        await collectionCard.API_create()

        expect(apiStore.request).toHaveBeenCalled()
        expect(uiStore.addNewCard).toHaveBeenCalledWith(1)
        expect(collectionCard.parentCollection.addCard).toHaveBeenCalled()
      })
    })

    describe('when Link has name (or any non-data item)', () => {
      beforeEach(() => {
        const record = { isLink: true, id: 1, name: 'Medium.com' }
        const mockParent = { addCard: jest.fn() }
        apiStore = fakeApiStore({
          requestResult: {
            data: { record },
          },
        })
        collectionCard = new CollectionCard(
          { ...collectionCardAttributes, parent: mockParent },
          apiStore
        )
      })
      it('adds new card to the UI Store', async () => {
        await collectionCard.API_create()

        expect(apiStore.request).toHaveBeenCalled()
        expect(uiStore.addNewCard).not.toHaveBeenCalled()
        expect(collectionCard.parentCollection.addCard).toHaveBeenCalled()
      })
    })
  })

  describe('reselectOnlyEditableRecords', () => {
    beforeEach(() => {
      apiStore.findAll = jest
        .fn()
        .mockReturnValue([
          { id: '10', link: false, record: { can_edit: false } },
          { id: '11', link: true, record: { can_edit: false } },
          { id: '12', link: false, record: { can_edit: true } },
        ])
      collectionCard = new CollectionCard(collectionCardAttributes, apiStore)
    })

    it('rejects non-links where the record is not editable', () => {
      collectionCard.reselectOnlyEditableRecords(['10', '11', '12'])
      expect(uiStore.reselectCardIds).toHaveBeenCalledWith(['11', '12'])
    })
  })

  describe('reselectOnlyMovableCards', () => {
    beforeEach(() => {
      apiStore.findAll = jest
        .fn()
        .mockReturnValue([
          { id: '10', canMove: true },
          { id: '11', canMove: false },
          { id: '12', canMove: true },
        ])
      collectionCard = new CollectionCard(collectionCardAttributes, apiStore)
    })

    it('rejects cards that are not movable', () => {
      collectionCard.reselectOnlyMovableCards(['10', '11', '12'])
      expect(uiStore.reselectCardIds).toHaveBeenCalledWith(['10', '12'])
    })
  })
})
