import UiStore from '~/stores/UiStore'

let uiStore
const fakeCollection = {
  id: '123',
  internalType: 'collections',
  parent_collection_card: {},
}
describe('UiStore', () => {
  beforeEach(() => {
    // reset every time
    uiStore = new UiStore()
  })

  describe('#startDragging', () => {
    const cardId = '99'
    beforeEach(() => {
      expect(uiStore.multiMoveCardIds).toEqual([])
      uiStore.startDragging(cardId)
    })
    it('should store dragging cardId in multiMoveCardIds', () => {
      expect(uiStore.multiMoveCardIds).toEqual([cardId])
    })
    it('should store dragging cardId in dragCardMaster', () => {
      expect(uiStore.dragCardMaster).toEqual(cardId)
    })

    describe('with cardId part of a larger selection', () => {
      const selectedCardIds = [cardId, '1', '2', '3']
      beforeEach(() => {
        uiStore.reselectCardIds(selectedCardIds)
        uiStore.startDragging(cardId)
      })
      it('should update multiMoveCardIds to match selectedCardIds', () => {
        expect(uiStore.multiMoveCardIds).toEqual(selectedCardIds)
      })
    })
  })

  describe('#openMoveMenu', () => {
    const parentId = '111'
    const collection = { ...fakeCollection, name: 'BMC Template' }
    collection.parent_collection_card.id = parentId
    beforeEach(() => {
      uiStore.setViewingRecord(collection)
    })
    describe('with useTemplate action', () => {
      it('should set movingCardIds and templateName', () => {
        uiStore.openMoveMenu({
          from: collection,
          cardAction: 'useTemplate',
        })
        expect(uiStore.templateName).toEqual('BMC Template')
        expect(uiStore.movingCardIds).toEqual([parentId])
      })
    })
    describe('with move action', () => {})
  })
})
