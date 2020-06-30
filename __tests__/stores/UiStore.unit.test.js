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
      // this is used by zoomIn/Out
      uiStore.setViewingRecord(collection)
      uiStore.determineZoomLevels(
        uiStore.maxCols(collection),
        uiStore.maxGridWidth({
          pageMargins: uiStore.pageMargins(collection),
          maxCols: uiStore.maxCols(collection),
        })
      )
      uiStore.update('zoomLevel', 2)
    })

    describe('#adjustZoomLevel', () => {
      it('when zoomed out, should adjust to collection.maxZoom', () => {
        uiStore.adjustZoomLevel(collection)
        expect(uiStore.zoomLevel).toEqual(7) // because of #determineZoomLevels
      })

      it('should use collection.lastZoom if available', () => {
        uiStore.adjustZoomLevel({ ...collection, lastZoom: 2 })
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

    describe('#zoomOut', () => {
      it('increase zoom number until it reaches maxZoom', () => {
        uiStore.adjustZoomLevel({ ...collection, lastZoom: 2 })
        expect(uiStore.zoomLevel).toEqual(2)
        uiStore.zoomOut()
        expect(uiStore.zoomLevel).toEqual(3)
        uiStore.zoomOut()
        expect(uiStore.zoomLevel).toEqual(4)
      })
    })

    describe('#updateZoomLevel', () => {
      it('sets UiStore#zoomLevel and collection#lastZoom to given value', () => {
        uiStore.updateZoomLevel(3, collection)
        expect(collection.lastZoom).toEqual(3)
        expect(uiStore.zoomLevel).toEqual(3)
      })
    })

    describe('#determineZoomLevels', () => {
      describe('when 16 columns', () => {
        beforeEach(() => {
          collection.num_columns = 16
          uiStore.windowWidth = 1400
        })

        it('sets zoomLevels based on maxGridWidth and maxCols', () => {
          uiStore.determineZoomLevels(collection)
          expect(uiStore.zoomLevels).toEqual([
            { relativeZoomLevel: 1 },
            { col: 6, relativeZoomLevel: 1.4471346938775511 },
            { col: 8, relativeZoomLevel: 1.9293387755102043 },
            { col: 16, relativeZoomLevel: 3.8581551020408162 },
          ])
        })
      })
      describe('when 8 columns', () => {
        beforeEach(() => {
          collection.num_columns = 8
          uiStore.windowWidth = 1280
        })

        it('sets zoomLevels based on maxGridWidth and maxCols', () => {
          uiStore.determineZoomLevels(collection)
          expect(uiStore.zoomLevels).toEqual([
            { col: 4, relativeZoomLevel: 1 },
            { col: 6, relativeZoomLevel: 1.586171875 },
            { col: 8, relativeZoomLevel: 2.1146875 },
          ])
        })
      })
      describe('when 4 columns', () => {
        beforeEach(() => {
          collection.num_columns = 4
          uiStore.windowWidth = 620
        })

        it('sets zoomLevels based on maxGridWidth and maxCols', () => {
          uiStore.determineZoomLevels(collection)
          expect(uiStore.zoomLevels).toEqual([
            { relativeZoomLevel: 1 },
            { col: 2, relativeZoomLevel: 1.1221227887617067 },
            { col: 4, relativeZoomLevel: 2.2415816857440167 },
          ])
        })
      })
    })

    describe('#maxCols', () => {
      describe('on touchDevice', () => {
        beforeEach(() => {
          collection.num_columns = 16
          uiStore.isTouchDevice = true
          uiStore.windowWidth = 720
        })
        it('should return the minimum of num_columns and 8', () => {
          expect(uiStore.maxCols(collection)).toEqual(8)
        })
      })
      describe('on desktop', () => {
        beforeEach(() => {
          collection.num_columns = 4
          uiStore.isTouchDevice = false
          uiStore.windowWidth = 1280 // Can't set isMobile because it is computed
        })
        it('should return the minimum of num_columns and 16', () => {
          expect(uiStore.maxCols(collection)).toEqual(4)
        })
      })
    })
  })
})
