import { runInAction } from 'mobx'
import localStorage from 'mobx-localstorage'
import fakeApiStore from '#/mocks/fakeApiStore'
import UiStore from '~/stores/UiStore'
import isTouchDevice from 'is-touch-device'
import { ACTIVITY_LOG_PAGE_KEY } from '~/utils/variables'
import ChannelManager from '~/utils/ChannelManager'

jest.mock('../../app/javascript/utils/ChannelManager')
jest.mock('is-touch-device')
jest.mock('mobx-localstorage')

let uiStore
const fakeCollection = {
  id: '123',
  isCollection: true,
  parent_collection_card: {},
  setCollaborators: jest.fn(),
}
const fakeEvent = {
  target: { closest: jest.fn() },
}
describe('UiStore', () => {
  beforeEach(() => {
    // reset every time
    uiStore = new UiStore()
  })

  describe('BCT functions', () => {
    beforeEach(() => {
      runInAction(() => {
        uiStore.openContextMenu(fakeEvent, { card: { id: '1' } })
        uiStore.textEditingItem = { id: '1' }
        uiStore.reselectCardIds([1, 2, 3])
      })
    })

    describe('#openBlankContentTool', () => {
      it('should deselect cards, close menus, close textEditingItem', () => {
        expect(uiStore.actionMenuOpenForCard('1')).toBe(true)
        expect(uiStore.isEditingText).toBe(true)
        expect(uiStore.selectedCardIds.length).toEqual(3)
        uiStore.openBlankContentTool()
        expect(uiStore.actionMenuOpenForCard('1')).toBe(false)
        expect(uiStore.isEditingText).toBe(false)
        expect(uiStore.selectedCardIds.length).toEqual(0)
      })

      it('should assign fields to blankContentToolState', () => {
        let { blankContentToolState } = uiStore
        expect(blankContentToolState.order).toBe(null)
        expect(blankContentToolState.row).toBe(null)
        expect(blankContentToolState.col).toBe(null)
        uiStore.openBlankContentTool({
          order: 2,
          row: 3,
          col: 4,
        })
        blankContentToolState = uiStore.blankContentToolState
        expect(blankContentToolState.order).toBe(2)
        expect(blankContentToolState.row).toBe(3)
        expect(blankContentToolState.col).toBe(4)
      })

      describe('with placeholderCard', () => {
        beforeEach(() => {
          uiStore.setBctPlaceholderCard({ id: '99' })
          uiStore.closeBlankContentTool = jest.fn()
        })
        it('should call closeBlankContentTool to clear the card', () => {
          uiStore.openBlankContentTool()
          expect(uiStore.closeBlankContentTool).toHaveBeenCalled()
        })
      })
    })

    describe('#closeBlankContentTool', () => {
      const stopReplacing = jest.fn()
      beforeEach(() => {
        uiStore.apiStore = fakeApiStore()
        uiStore.apiStore.findAll = jest
          .fn()
          .mockReturnValue([
            { id: '10', currentlyReplacing: true, stopReplacing },
            { id: '11' },
          ])
      })

      it('should set blankContentToolState back to the defaults', () => {
        uiStore.openBlankContentTool({
          order: 2,
          row: 3,
          col: 4,
        })
        uiStore.closeBlankContentTool()
        const { blankContentToolState } = uiStore
        expect(blankContentToolState.order).toBe(null)
        expect(blankContentToolState.row).toBe(null)
        expect(blankContentToolState.col).toBe(null)
      })

      it('should turn off currentlyReplacing card', () => {
        uiStore.closeBlankContentTool()
        expect(stopReplacing).toHaveBeenCalled()
      })

      describe('with placeholderCard', () => {
        const card = { id: '99', API_destroy: jest.fn() }
        beforeEach(() => {
          uiStore.setBctPlaceholderCard(card)
        })
        it('should call API_destroy to clear the placeholder', () => {
          uiStore.closeBlankContentTool()
          expect(card.API_destroy).toHaveBeenCalled()
        })
      })
    })

    describe('#blankContentToolIsOpen', () => {
      it('should check if there is at least a row set on blankContentToolState', () => {
        uiStore.closeBlankContentTool()
        expect(uiStore.blankContentToolIsOpen).toBe(false)
        uiStore.openBlankContentTool({ row: 0, col: 0 })
        expect(uiStore.blankContentToolIsOpen).toBe(true)
      })
    })
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

    describe('with a section card', () => {
      const collection = {
        ...fakeCollection,
        collection_cards: [{ id: '99', isSection: true }],
        cardIdsBetween: jest.fn(),
      }
      beforeEach(() => {
        uiStore.setViewingRecord(collection)
      })

      it('should call cardIdsBetween to select cards in the section', () => {
        uiStore.reselectCardIds(['99'])
        expect(collection.cardIdsBetween).toHaveBeenCalledWith('99', '99')
      })
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

  describe('#toggleSelectedCardId', () => {
    const collection = {
      ...fakeCollection,
      collection_cards: [{ id: '99', isSection: true }, { id: '100' }],
      // mock return value to simulate card 100 being inside the section
      cardIdsBetween: jest.fn().mockReturnValue(['100']),
    }
    beforeEach(() => {
      uiStore.setViewingRecord(collection)
    })

    it('should set the cardId as selected', () => {
      uiStore.toggleSelectedCardId('100')
      expect(uiStore.isSelected('100')).toBe(true)
    })

    it('should deselect the parent section if cardId is deselected', () => {
      uiStore.toggleSelectedCardId('99')
      uiStore.toggleSelectedCardId('100')
      expect(uiStore.isSelected('99')).toBe(true)
      expect(uiStore.isSelected('100')).toBe(true)
      // now deselect
      uiStore.toggleSelectedCardId('100')
      expect(uiStore.isSelected('99')).toBe(false)
      // section should also get deselected
      expect(uiStore.isSelected('100')).toBe(false)
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

  describe('#selectCardsWithinSelectedArea', () => {
    const coords = {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 200,
    }
    beforeEach(() => {
      uiStore.setSelectedArea(coords)
      // cardPositions determines where each card is placed on the grid
      // gets called in GridCard when it sets the ref
      uiStore.setCardPosition('1', { top: 0, right: 100, bottom: 100, left: 0 })
      uiStore.setCardPosition('2', {
        top: 300,
        right: 100,
        bottom: 500,
        left: 0,
      })
      uiStore.setViewingRecord({
        ...fakeCollection,
        collection_cards: [],
        cardIds: ['1', '2', '5'],
      })
    })

    it('selects cards in within the selectedArea', () => {
      expect(uiStore.selectedCardIds).toEqual([])
      uiStore.selectCardsWithinSelectedArea()
      expect(uiStore.selectedCardIds).toEqual(['1'])
    })

    it('adds to selection if shifted', () => {
      uiStore.reselectCardIds(['5'])
      uiStore.setSelectedArea(coords, { shifted: true })
      uiStore.selectCardsWithinSelectedArea()
      expect(uiStore.selectedCardIds).toEqual(['1', '5'])
    })

    it('omits cards that are not in viewingCollection', () => {
      uiStore.setViewingRecord({ ...fakeCollection, id: '999', cardIds: ['2'] })
      uiStore.selectCardsWithinSelectedArea()
      expect(uiStore.selectedCardIds).toEqual([])
    })
  })

  describe('zoom functions', () => {
    const collection = fakeCollection
    beforeEach(() => {
      collection.isBoard = true
      collection.maxZoom = 3
      window.scrollTo = jest.fn()
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
        uiStore.zoomIn(false)
        expect(window.scrollTo).toHaveBeenCalled()
        expect(uiStore.zoomLevel).toEqual(1)
        window.scrollTo.mockClear()
        uiStore.zoomIn(false)
        expect(window.scrollTo).not.toHaveBeenCalled()
        expect(uiStore.zoomLevel).toEqual(1)
      })
    })

    describe('#zoomOut', () => {
      it('increase zoom number until it reaches maxZoom', () => {
        uiStore.adjustZoomLevel({ ...collection, lastZoom: 2 })
        expect(uiStore.zoomLevel).toEqual(2)
        uiStore.zoomOut(false)
        expect(uiStore.zoomLevel).toEqual(3)
        uiStore.zoomOut(false)
        expect(uiStore.zoomLevel).toEqual(4)
      })
    })

    describe('#updateZoomLevel', () => {
      it('sets UiStore#tempZoomLevel and collection#lastZoom to given value', () => {
        uiStore.updateZoomLevel(3, collection)
        expect(collection.lastZoom).toEqual(3)
        expect(uiStore.tempZoomLevel).toEqual(3)
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
          isTouchDevice.mockImplementation(() => true)
          uiStore.windowWidth = 720
        })
        it('should return the minimum of num_columns and 8', () => {
          expect(uiStore.maxCols(collection)).toEqual(8)
        })
      })
      describe('on desktop', () => {
        beforeEach(() => {
          collection.num_columns = 4
          isTouchDevice.mockImplementation(() => false)
          uiStore.windowWidth = 1280 // Can't set isMobile because it is computed
        })
        it('should return the minimum of num_columns and 16', () => {
          expect(uiStore.maxCols(collection)).toEqual(4)
        })
      })
    })

    describe('#setActivityLogPage', () => {
      it('should set the local storage key for page', () => {
        uiStore.setActivityLogPage('notifications')
        expect(uiStore.activityLogPage).toEqual('notifications')
        expect(localStorage.getItem(ACTIVITY_LOG_PAGE_KEY)).toEqual(
          'notifications'
        )
      })
    })

    describe('#setBodyBackgroundImage', () => {
      it('should set the background style on document.body', () => {
        const img = 'http://img.url/123'
        uiStore.setBodyBackgroundImage(img)
        expect(document.body.style['background-image']).toEqual(`url(${img})`)
      })
    })

    describe('#setBodyFontColor', () => {
      it('should set the color style on document.body', () => {
        uiStore.setBodyFontColor('blue')
        expect(document.body.style.color).toEqual('blue')
      })
    })
  })

  describe('createRoles', () => {
    beforeEach(() => {
      const apiStore = fakeApiStore()
      apiStore.fetchAll = jest.fn()
      uiStore.apiStore = apiStore
    })

    describe('with users', () => {
      let users
      let record = fakeCollection

      beforeEach(async () => {
        record.internalType = 'collections'
        users = [
          { id: 3, internalType: 'users' },
          { id: 5, internalType: 'users' },
        ]
        uiStore.apiStore.request.mockReturnValue(Promise.resolve({ data: [] }))
        uiStore.apiStore.fetchAll.mockReturnValue(Promise.resolve({ data: [] }))
        await uiStore.createRoles(
          users,
          'editor',
          { isSwitching: true, sendInvites: false },
          record
        )
      })

      it('should send a request to create roles with role and user ids', () => {
        expect(uiStore.apiStore.request).toHaveBeenCalledWith(
          `${record.internalType}/${record.id}/roles`,
          'POST',
          {
            role: { name: 'editor' },
            user_ids: [3, 5],
            group_ids: [],
            is_switching: true,
            send_invites: false,
          }
        )
      })

      describe('when not switching roles', () => {
        record = {
          id: 4,
          internalType: 'group',
        }
        beforeEach(async () => {
          uiStore.apiStore.request.mockClear()
          await uiStore.createRoles(
            users,
            'editor',
            { isSwitching: false, sendInvites: false },
            record
          )
        })

        it('should pass is switching as false', () => {
          expect(
            uiStore.apiStore.request.mock.calls[0][2].is_switching
          ).toBeFalsy()
        })
      })

      describe('when assigning to a group', () => {
        beforeEach(async () => {
          record = {
            id: 4,
            internalType: 'groups',
          }
          await uiStore.createRoles(
            users,
            'member',
            {
              addToGroupId: 4,
              sendInvites: false,
              isSwitching: true,
            },
            record
          )
        })

        it('should request the groups endpoint with the group id', () => {
          expect(uiStore.apiStore.request).toHaveBeenCalledWith(
            `${record.internalType}/${record.id}/roles`,
            'POST',
            {
              role: { name: 'member' },
              user_ids: [3, 5],
              group_ids: [],
              is_switching: true,
              send_invites: false,
            }
          )
        })
      })
    })
  })

  describe('clearTempTextCardItems', () => {
    beforeEach(() => {
      uiStore.setViewingRecord({
        ...fakeCollection,
        id: '123123',
        tempTextCard: { id: -7 },
        newPersistedTextCard: { id: '10', record: {} },
      })
    })

    it('should clear temp values set on viewingCollection', () => {
      const { viewingCollection } = uiStore
      expect(viewingCollection.tempTextCard).not.toBe(null)
      expect(viewingCollection.newPersistedTextCard).not.toBe(null)
      uiStore.clearTempTextCardItems()
      expect(viewingCollection.tempTextCard).toBe(null)
      expect(viewingCollection.newPersistedTextCard).toBe(null)
    })

    it('should set hotSwap text data as needed', () => {
      const { viewingCollection } = uiStore
      const { record } = viewingCollection.newPersistedTextCard
      const fakeQuillData = { ops: [{}] }
      uiStore.clearTempTextCardItems({
        hotSwapQuillContent: fakeQuillData,
        hotSwapQuillPosition: 5,
      })
      expect(record.quill_data).toEqual(fakeQuillData)
      expect(uiStore.hotSwapQuillPosition).toEqual(5)
    })
  })

  describe('broadcasting functions', () => {
    let collaborators = []
    let fakeChannel
    beforeEach(() => {
      fakeChannel = { perform: jest.fn() }
      ChannelManager.getChannel = jest.fn().mockReturnValue(fakeChannel)
    })

    describe('with other collaborators', () => {
      beforeEach(() => {
        collaborators = [{ id: '1' }]
        uiStore.setViewingRecord({
          ...fakeCollection,
          collaborators,
        })
      })

      it('should send the cursor position over the channel', () => {
        const coordinates = { x: 1, y: 2 }
        uiStore.broadcastCursorPosition(coordinates)
        expect(fakeChannel.perform).toHaveBeenCalledWith('cursor', {
          coordinates,
        })
      })

      it('should send the card selection over the channel', () => {
        const card_ids = [1, 2]
        uiStore.broadcastCardSelection(card_ids)
        expect(fakeChannel.perform).toHaveBeenCalledWith('cards_selected', {
          card_ids,
        })
      })
    })

    describe('without other collaborators', () => {
      beforeEach(() => {
        collaborators = []
        uiStore.setViewingRecord({
          ...fakeCollection,
          collaborators,
        })
      })

      it('should not send the cursor position over the channel', () => {
        const coordinates = { x: 1, y: 2 }
        uiStore.broadcastCursorPosition(coordinates)
        expect(fakeChannel.perform).not.toHaveBeenCalled()
      })
    })
  })
})
