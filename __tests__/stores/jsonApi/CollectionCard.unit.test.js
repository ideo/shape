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
  collectionCard = new CollectionCard(collectionCardAttributes, apiStore)
})

describe('CollectionCard', () => {
  describe('canEdit', () => {
    it('returns true if card is a link and you can edit the parent', () => {
      collectionCard.link = true
      collectionCard.can_edit_parent = true
      expect(collectionCard.canEdit).toBeTruthy()
      collectionCard.can_edit_parent = false
      expect(collectionCard.canEdit).toBeFalsy()
    })

    it('returns true if card is not a link and you can edit the record', () => {
      collectionCard.link = false
      collectionCard.record = { can_edit: true }
      expect(collectionCard.canEdit).toBeTruthy()
      collectionCard.record = { can_edit: false }
      expect(collectionCard.canEdit).toBeFalsy()
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
})
