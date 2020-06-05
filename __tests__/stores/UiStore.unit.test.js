import { runInAction } from 'mobx'
import fakeApiStore from '#/mocks/fakeApiStore'
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
    it('should reselectCardIds', () => {
      expect(uiStore.selectedCardIds).toEqual([cardId])
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
    const collection = {
      ...fakeCollection,
      firstCardId: jest.fn().mockReturnValue('99'),
      name: 'BMC Template',
    }
    collection.parent_collection_card.id = parentId
    beforeEach(() => {
      uiStore.setViewingRecord(collection)
    })
    describe('with move action (default)', () => {
      it('should set cardAction and movingFromCollectionId', () => {
        uiStore.openMoveMenu({
          from: collection,
        })
        expect(uiStore.cardAction).toEqual('move')
        expect(uiStore.movingFromCollectionId).toEqual(collection.id)
      })
      it('should move the first selected card to the beginning of the array', () => {
        uiStore.selectedCardIds = ['1', '99', '2']
        uiStore.openMoveMenu({
          from: collection,
        })
        expect(collection.firstCardId).toHaveBeenCalled()
        expect(uiStore.movingCardIds).toEqual(['99', '1', '2'])
      })
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
  })

  describe('#closeMoveMenu', () => {
    beforeEach(() => {
      runInAction(() => {
        uiStore.dismissedMoveHelper = true
        uiStore.templateName = 'blah'
        uiStore.cardAction = 'duplicate'
        uiStore.isLoadingMoveAction = true
        uiStore.movingCardIds.replace(['1'])
        uiStore.multiMoveCardIds.replace(['2'])
        uiStore.movingIntoCollection = { id: '123' }
        uiStore.movingFromCollectionId = '123'
        uiStore.draggingFromMDL = true
        uiStore.selectedCardIds = ['1', '2']
      })
    })

    it('should clear out all related values', () => {
      uiStore.closeMoveMenu()

      expect(uiStore.dismissedMoveHelper).toEqual(false)
      expect(uiStore.templateName).toEqual('')
      expect(uiStore.cardAction).toEqual('move')
      expect(uiStore.isLoadingMoveAction).toEqual(false)
      expect(uiStore.movingCardIds).toEqual([])
      expect(uiStore.multiMoveCardIds).toEqual([])
      expect(uiStore.movingIntoCollection).toEqual(null)
      expect(uiStore.movingFromCollectionId).toEqual(null)
      expect(uiStore.draggingFromMDL).toEqual(false)
    })
  })

  describe('reselectOnlyEditableRecords', () => {
    beforeEach(() => {
      uiStore.apiStore = fakeApiStore()
      uiStore.apiStore.findAll = jest
        .fn()
        .mockReturnValue([
          { id: '10', link: false, record: { can_edit: false } },
          { id: '11', link: true, record: { can_edit: false } },
          { id: '12', link: false, record: { can_edit: true } },
        ])
    })

    it('rejects non-links where the record is not editable', () => {
      uiStore.reselectOnlyEditableRecords(['10', '11', '12'])
      expect(uiStore.selectedCardIds).toEqual(['11', '12'])
    })
  })

  describe('reselectOnlyMovableCards', () => {
    beforeEach(() => {
      uiStore.apiStore = fakeApiStore()
      uiStore.apiStore.findAll = jest
        .fn()
        .mockReturnValue([
          { id: '10', canMove: true },
          { id: '11', canMove: false },
          { id: '12', canMove: true },
        ])
    })

    it('rejects non-links where the record is not editable', () => {
      uiStore.reselectOnlyMovableCards(['10', '11', '12'])
      expect(uiStore.selectedCardIds).toEqual(['10', '12'])
    })
  })

  describe('zoom functions', () => {
    const collection = fakeCollection
    beforeEach(() => {
      collection.isBoard = true
      collection.maxZoom = 3
      uiStore.update('zoomLevel', 2)
      // this is used by zoomIn/Out
      uiStore.setViewingRecord(collection)
    })

    describe('#adjustZoomLevel', () => {
      it('when zoomed out, should adjust to collection.maxZoom', () => {
        uiStore.adjustZoomLevel({ collection })
        expect(uiStore.zoomLevel).toEqual(3)
      })

      it('should use collection.lastZoom if available', () => {
        uiStore.adjustZoomLevel({ collection: { ...collection, lastZoom: 2 } })
        expect(uiStore.zoomLevel).toEqual(2)
      })
    })

    describe('#zoomIn', () => {
      it('reduces zoom number until it reaches 1', () => {
        expect(uiStore.zoomLevel).toEqual(2)
        uiStore.zoomIn()
        expect(uiStore.zoomLevel).toEqual(1)
        uiStore.zoomIn()
        expect(uiStore.zoomLevel).toEqual(1)
      })
    })

    describe('#zoomIn', () => {
      it('increase zoom number until it reaches maxZoom', () => {
        expect(uiStore.zoomLevel).toEqual(2)
        uiStore.zoomOut()
        expect(uiStore.zoomLevel).toEqual(3)
        uiStore.zoomOut()
        expect(uiStore.zoomLevel).toEqual(3)
      })
    })
  })
})
