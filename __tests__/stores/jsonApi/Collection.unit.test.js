import _ from 'lodash'
import { runInAction } from 'mobx'
import { ReferenceType, updateModelId } from 'datx'

// apiStore must be imported first
// or else you run into a circular dependency issue
import { apiStore } from '~/stores'
import Collection, { ROW_ACTIONS } from '~/stores/jsonApi/Collection'
import Organization from '~/stores/jsonApi/Organization'
import User from '~/stores/jsonApi/User'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import CollectionFilter from '~/stores/jsonApi/CollectionFilter'
import googleTagManager from '~/vendor/googleTagManager'
import queryString from 'query-string'

import { fakeRole, fakeCollection } from '#/mocks/data'
jest.mock('../../../app/javascript/vendor/googleTagManager')

let collectionCard_1, collectionCard_2, collectionCard_3

const initializeCards = () => {
  collectionCard_1 = new CollectionCard()
  updateModelId(collectionCard_1, '1')
  collectionCard_2 = new CollectionCard()
  updateModelId(collectionCard_2, '2')
  collectionCard_3 = new CollectionCard()
  updateModelId(collectionCard_3, '3')
}

describe('Collection', () => {
  let collection, organization
  initializeCards()
  beforeEach(() => {
    collection = new Collection(
      {
        name: 'fakeCollection',
        roles: [fakeRole],
        organization_id: '1',
        parent: { name: 'Some Collection' },
      },
      apiStore
    )
    organization = new Organization(
      {
        name: 'MyOrg',
      },
      apiStore
    )
    updateModelId(organization, '1')
    initializeCards()
    runInAction(() => {
      apiStore.currentUserOrganizationId = '1'
    })
    apiStore.add(organization, 'organizations')
  })

  describe('isNormalCollection', () => {
    describe('on a user collection', () => {
      beforeEach(() => {
        collection.type = 'Collection::UserCollection'
      })

      it('should return false', () => {
        expect(collection.isNormalCollection).toBeFalsy()
      })
    })

    describe('on a shared collection', () => {
      beforeEach(() => {
        collection.type = 'Collection::SharedWithMeCollection'
      })

      it('should return false', () => {
        expect(collection.isNormalCollection).toBeFalsy()
      })
    })

    describe('on a normal collection', () => {
      beforeEach(() => {
        collection.type = 'Collection'
      })

      it('should return true', () => {
        expect(collection.isNormalCollection).toBeTruthy()
      })
    })
  })

  describe('shouldShowEditWarning', () => {
    it('should be false for non-template', () => {
      expect(collection.shouldShowEditWarning).toBe(false)
    })

    describe('for a template', () => {
      beforeEach(() => {
        collection.master_template = true
        collection.template_num_instances = 10
      })

      it('should be true', () => {
        expect(collection.shouldShowEditWarning).toBe(true)
      })

      it('should be false once snoozed', () => {
        collection.toggleEditWarnings()
        expect(collection.shouldShowEditWarning).toBe(false)
      })

      it('should be true if snooze toggled', () => {
        collection.toggleEditWarnings()
        collection.toggleEditWarnings()
        expect(collection.shouldShowEditWarning).toBe(true)
      })

      it('should be false if no instances', () => {
        collection.template_num_instances = 0
        expect(collection.shouldShowEditWarning).toBe(false)
      })
    })
  })

  describe('cardIdsBetween', () => {
    beforeEach(() => {
      collection.cardIdsBetweenByOrder = jest.fn()
      collection.cardIdsBetweenByColRow = jest.fn()
    })

    it('calls cardIdsBetweenByOrder', () => {
      collection.cardIdsBetween(0, 1)
      expect(collection.cardIdsBetweenByOrder).toHaveBeenCalled()
      expect(collection.cardIdsBetweenByColRow).not.toHaveBeenCalled()
    })

    describe('with Board collection', () => {
      beforeEach(() => {
        collection.type = 'Collection::Board'
      })

      it('calls cardIdsBetweenByColRow', () => {
        collection.cardIdsBetween(0, 1)
        expect(collection.cardIdsBetweenByColRow).toHaveBeenCalled()
        expect(collection.cardIdsBetweenByOrder).not.toHaveBeenCalled()
      })
    })
  })

  describe('cardIdsBetweenByOrder', () => {
    let cardIds, firstThreeCardIds
    beforeEach(() => {
      // Using real collection cards and API store,
      // as the mocked store did not function correctly\
      const collCardAttrs = [
        { order: 1, width: 1, height: 1 },
        { order: 2, width: 1, height: 1 },
        { order: 3, width: 1, height: 1 },
        { order: 4, width: 1, height: 1 },
      ]
      collection.addReference('collection_cards', collCardAttrs, {
        model: CollectionCard,
        type: ReferenceType.TO_MANY,
      })
      cardIds = collection.cardIds
      firstThreeCardIds = _.slice(cardIds, 0, 2)
    })

    it('returns card ids between first and 2nd to last card', () => {
      expect(collection.cardIdsBetweenByOrder(cardIds[0], cardIds[2])).toEqual(
        firstThreeCardIds
      )
    })

    it('if in reverse order, returns card ids between first and 2nd to last', () => {
      expect(collection.cardIdsBetweenByOrder(cardIds[2], cardIds[0])).toEqual(
        firstThreeCardIds
      )
    })

    describe('firstCardId', () => {
      it('should always get the first ordered card out of the given ids', () => {
        expect(collection.firstCardId(_.reverse(firstThreeCardIds))).toEqual(
          cardIds[0]
        )
      })
      it('should always return an id even if none found in collection_cards', () => {
        expect(collection.firstCardId(['123321'])).toEqual('123321')
      })
    })
  })

  describe('board collection', () => {
    let cardIds
    beforeEach(() => {
      /*
        Using real collection cards and API store,
        as the mocked store did not function correctly

        Cards are in position (number is card index):
        0 0 - 1
        - - 2 2
        - - - 3
        - - - 3
      */
      collection.num_columns = 16
      collection.type = 'Collection::Board'
      const collCardAttrs = [
        { col: 0, row: 0, height: 1, width: 2 },
        { col: 3, row: 0, height: 1, width: 1 },
        { col: 2, row: 1, height: 1, width: 2 },
        { col: 3, row: 2, height: 2, width: 1 },
      ]
      collection.addReference('collection_cards', collCardAttrs, {
        model: CollectionCard,
        type: ReferenceType.TO_MANY,
      })
      cardIds = collection.cardIds
    })

    describe('cardMatrix', () => {
      it('returns array of arrays', () => {
        const matrix = collection.cardMatrix

        expect(matrix[0][0].id).toEqual(cardIds[0])
        expect(matrix[0][1].id).toEqual(cardIds[0])
        expect(matrix[0][2]).toEqual(undefined)
        expect(matrix[0][3].id).toEqual(cardIds[1])

        expect(matrix[1][0]).toEqual(undefined)
        expect(matrix[1][1]).toEqual(undefined)
        expect(matrix[1][2].id).toEqual(cardIds[2])
        expect(matrix[1][3].id).toEqual(cardIds[2])

        expect(matrix[2][0]).toEqual(undefined)
        expect(matrix[2][1]).toEqual(undefined)
        expect(matrix[2][2]).toEqual(undefined)
        expect(matrix[2][3].id).toEqual(cardIds[3])

        expect(matrix[3][0]).toEqual(undefined)
        expect(matrix[3][1]).toEqual(undefined)
        expect(matrix[3][2]).toEqual(undefined)
        expect(matrix[3][3].id).toEqual(cardIds[3])
      })
    })

    describe('cardIdsBetweenByColRow', () => {
      it('returns cards in rectangular area from two cards', () => {
        expect(
          collection.cardIdsBetweenByColRow(cardIds[0], cardIds[1])
        ).toEqual([cardIds[0], cardIds[1]])

        expect(
          collection.cardIdsBetweenByColRow(cardIds[2], cardIds[3])
        ).toEqual([cardIds[2], cardIds[3]])

        expect(
          collection.cardIdsBetweenByColRow(cardIds[0], cardIds[2])
        ).toEqual([cardIds[0], cardIds[1], cardIds[2]])

        expect(
          collection.cardIdsBetweenByColRow(cardIds[0], cardIds[3])
        ).toEqual(cardIds)

        expect(
          collection.cardIdsBetweenByColRow(cardIds[3], cardIds[0])
        ).toEqual(cardIds)
      })
    })
  })

  describe('trackTestAction', () => {
    describe('when launching a test', () => {
      beforeEach(() => {
        collection.class_type = 'Collection::TestCollection'
      })
      it('pushes a feedback test launch event to google tag manager', () => {
        collection.trackTestAction({ actionName: 'launch' })

        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: 'launch Feedback Test',
          hasLinkSharingAudience: false,
          hasPaidAudience: false,
          ideasCount: 0,
          testId: collection.id,
          timestamp: expect.any(String),
        })
      })
    })
  })

  describe('trackAudienceTargeting', () => {
    describe('when launching a test successfully', () => {
      describe('when link sharing audience', () => {
        it('pushes a feedback test launch event to google tag manager', () => {
          collection.trackAudienceTargeting({ isLinkSharing: true })

          expect(googleTagManager.push).toHaveReturned(undefined)
        })
      })
      describe('when paid audience', () => {
        it('pushes a feedback test launch event to google tag manager', () => {
          collection.trackAudienceTargeting({ isLinkSharing: false })

          expect(googleTagManager.push).toHaveBeenCalledWith({
            event: 'formSubmission',
            formType: `Audience targeted with a test`,
          })
        })
      })
    })
  })

  describe('numPaidQuestions', () => {
    beforeEach(() => {
      const testCardAttrs = [
        { section_type: 'intro', card_question_type: 'question_open' },
        { section_type: 'intro', card_question_type: 'question_open' },
        { section_type: 'ideas', card_question_type: 'ideas_collection' },
        { section_type: 'ideas', card_question_type: 'question_open' },
        { section_type: 'ideas', card_question_type: 'question_open' },
        { section_type: 'ideas', card_question_type: 'question_open' },
        { section_type: 'ideas', card_question_type: 'question_open' },
        { section_type: 'ideas', card_question_type: 'question_open' },
        { section_type: 'outro', card_question_type: 'question_open' },
        { section_type: 'outro', card_question_type: 'question_finish' },
      ]
      // Create Test Collection
      collection = new Collection(
        {
          name: 'My Test',
          type: 'Collection::TestCollection',
        },
        apiStore
      )
      // Add all questions
      collection.addReference('collection_cards', testCardAttrs, {
        model: CollectionCard,
        type: ReferenceType.TO_MANY,
      })
      // Find the ideas collection card
      const ideasCollectionCard = collection.collection_cards.find(
        card => card.card_question_type === 'ideas_collection'
      )
      // Add the ideas collection
      ideasCollectionCard.addReference(
        'record',
        { name: 'Ideas' },
        { model: Collection, type: ReferenceType.TO_ONE }
      )
      // Add both ideas
      const ideaAttrs = [
        { name: 'Idea 1', question_type: 'question_idea' },
        { name: 'Idea 2', question_type: 'question_idea' },
      ]
      ideasCollectionCard.record.addReference('collection_cards', ideaAttrs, {
        model: CollectionCard,
        type: ReferenceType.TO_MANY,
      })
    })

    it('returns count of non-idea cards + ideas * num idea cards', () => {
      // 2 in intro, 2 ideas * 6 cards in ideas, 1 in outro
      expect(collection.numPaidQuestions).toEqual(15)
    })
  })

  describe('API_fetchCards', () => {
    const fakeCollectionCardData = {
      type: 'collection_cards',
      attributes: {
        order: 0,
        parent_id: '101',
      },
    }
    let requestResult = () => {
      return {
        data: [
          { id: '1', ...fakeCollectionCardData },
          { id: '2', ...fakeCollectionCardData },
        ],
        links: {
          last: 5,
        },
      }
    }
    beforeEach(() => {
      apiStore.request = jest.fn().mockImplementation(x => {
        collection.cache_key = 'new-cache-key'
        return Promise.resolve(requestResult())
      })
      collection = new Collection(
        {
          name: 'fakeCollection',
          cache_key: 'old-cache-key',
        },
        apiStore
      )
      updateModelId(collection, '101')
    })

    it('should call apiStore with default params', () => {
      collection.API_fetchCards()
      expect(apiStore.request).toHaveBeenCalledWith(
        `collections/${collection.id}/collection_cards?page=1&per_page=${collection.recordsPerPage}`
      )
    })

    it('should update collection attributes accordingly', async () => {
      // before
      expect(collection.totalPages).toEqual(1)
      expect(collection.cache_key).toEqual('old-cache-key')
      expect(collection.collection_cards.length).toEqual(0)

      await collection.API_fetchCards()
      // after
      expect(collection.totalPages).toEqual(5)
      expect(collection.cache_key).toEqual('new-cache-key')
      expect(collection.storedCacheKey).toEqual('new-cache-key')
      expect(collection.collection_cards.length).toEqual(2)
    })

    describe('with row parameters for a board', () => {
      it('should update loadedRows', async () => {
        collection = new Collection(
          {
            name: 'fakeCollection',
            class_type: 'Collection::Board',
          },
          apiStore
        )
        await collection.API_fetchCards({ rows: [3, 10] })
        expect(collection.loadedRows).toEqual(10)
      })
    })

    describe('as search collection with no filters', () => {
      let searchResultsCollection
      beforeEach(() => {
        searchResultsCollection = new Collection(
          {
            name: 'fakeSearchResultsCollection',
            class_type: 'SearchResultsCollection',
            search_term: '#building-ventures within:123456',
            organization_id: 1,
          },
          apiStore
        )
        searchResultsCollection.collection = collection
        updateModelId(searchResultsCollection, '102')
      })

      it('uses search_collection_cards endpoint', async () => {
        await searchResultsCollection.API_fetchCards({
          searchTerm: searchResultsCollection.search_term,
          page: 1,
          per_page: searchResultsCollection.searchRecordsPerPage,
        })
        const urlParams = queryString.stringify({
          current_collection_id: searchResultsCollection.id,
          page: 1,
          per_page: searchResultsCollection.searchRecordsPerPage,
          query: '#building-ventures within:123456',
        })
        expect(apiStore.request).toHaveBeenCalledWith(
          `organizations/1/search_collection_cards?${urlParams}`
        )
      })
    })

    describe('as search collection with filters', () => {
      let searchResultsCollection
      beforeEach(() => {
        searchResultsCollection = new Collection(
          {
            name: 'fakeSearchResultsCollection',
            class_type: 'SearchResultsCollection',
            search_term: '#building-ventures within:123456',
            organization_id: 1,
          },
          apiStore
        )
        searchResultsCollection.collection = collection
        updateModelId(searchResultsCollection, '102')
        collection.addReference(
          'collection_filters',
          [
            {
              filter_type: 'tag',
              text: 'plant',
              selected: true,
            },
            {
              filter_type: 'tag',
              text: 'purpose',
              selected: true,
            },
          ],
          {
            model: CollectionFilter,
            type: ReferenceType.TO_MANY,
          }
        )
      })

      it('combines search_term and collection filters', async () => {
        await searchResultsCollection.API_fetchCards({
          searchTerm: searchResultsCollection.search_term,
          page: 1,
          per_page: searchResultsCollection.searchRecordsPerPage,
        })
        const urlParams = queryString.stringify({
          current_collection_id: searchResultsCollection.id,
          page: 1,
          per_page: searchResultsCollection.searchRecordsPerPage,
          query: '#building-ventures within:123456 #plant #purpose',
        })
        expect(apiStore.request).toHaveBeenCalledWith(
          `organizations/1/search_collection_cards?${urlParams}`
        )
      })
    })

    describe('with cache keys', () => {
      beforeEach(() => {
        requestResult = () => {
          return {
            data: [{ id: '3', ...fakeCollectionCardData }],
            links: {
              last: 5,
            },
          }
        }
        runInAction(() => {
          collection.collection_cards = [collectionCard_1, collectionCard_2]
          collection.storedCacheKey = 'new-cache-key'
        })
      })
      describe('with same cache key', () => {
        it('should do a union of collection_cards', async () => {
          await collection.API_fetchCards()
          // order should be preserved as 1, 2, 3 (new data last)
          expect(_.map(collection.collection_cards, 'id')).toEqual([
            '1',
            '2',
            '3',
          ])
        })
      })

      describe('with new cache key', () => {
        beforeEach(() => {
          runInAction(() => {
            collection.storedCacheKey = 'old-cache-key'
          })
        })

        it('should replace collection_cards', async () => {
          await collection.API_fetchCards()
          // should just replace collection_cards with [2]
          expect(_.map(collection.collection_cards, 'id')).toEqual(['3'])
        })
      })
    })
  })

  describe('API_batchUpdateCardsWithUndo', () => {
    const updates = [{ card: collectionCard_1, row: 2, col: 3 }]
    beforeEach(() => {
      runInAction(() => {
        collectionCard_1.row = 0
        collectionCard_1.order = 0
        collection.class_type = 'Collection::Board'
        collectionCard_3.order = 99
        collection.collection_cards = [
          collectionCard_1,
          collectionCard_2,
          collectionCard_3,
        ]
      })
    })
    it('should call apiStore and apply local updates', async () => {
      expect(collectionCard_1.row).toEqual(0)
      await collection.API_batchUpdateCardsWithUndo({
        updates,
        undoMessage: 'Undoing action',
      })
      // local update should be applied and then sent through to apiStore
      const data = collection.toJsonApiWithCards([collectionCard_1.id])
      expect(data.attributes.collection_cards_attributes).toEqual([
        { id: collectionCard_1.id, order: 0, row: 2, col: 3 },
      ])
      expect(apiStore.request).toHaveBeenCalledWith(
        `collections/${collection.id}`,
        'PATCH',
        { data }
      )
    })
  })

  describe('API_manipulateRow', () => {
    beforeEach(() => {
      apiStore.request = jest.fn()
      apiStore.undoStore.pushUndoAction = jest.fn()
      runInAction(() => {
        collection.collection_cards = [
          { ...collectionCard_1, row: 1 },
          { ...collectionCard_2, row: 3 },
          { ...collectionCard_3, row: 4 },
        ]
      })
    })

    it('should bump up the row numbers of corresponding cards when calling insert', async () => {
      const action = ROW_ACTIONS.INSERT
      const row = 1
      await collection.API_manipulateRow({
        row,
        action,
      })
      const params = { row }
      expect(apiStore.request).toHaveBeenCalledWith(
        `collections/${collection.id}/${action}`,
        'POST',
        params
      )
      expect(apiStore.undoStore.pushUndoAction).toHaveBeenCalledWith({
        actionType: expect.any(String),
        apiCall: expect.any(Function),
        message: 'Insert row undone',
        redirectPath: { id: collection.id, type: 'collections' },
        redoAction: {
          apiCall: expect.any(Function),
          message: 'Insert row redone',
        },
      })
      expect(_.map(collection.collection_cards, 'row')).toEqual([1, 4, 5])
    })

    it('should bump down the row numbers of corresponding cards when calling remove', async () => {
      const action = ROW_ACTIONS.REMOVE
      const row = 2
      await collection.API_manipulateRow({
        row,
        action,
      })
      const params = { row }
      expect(apiStore.request).toHaveBeenCalledWith(
        `collections/${collection.id}/${action}`,
        'POST',
        params
      )
      expect(apiStore.undoStore.pushUndoAction).toHaveBeenCalledWith({
        actionType: expect.any(String),
        apiCall: expect.any(Function),
        message: 'Remove row undone',
        redirectPath: { id: collection.id, type: 'collections' },
        redoAction: {
          apiCall: expect.any(Function),
          message: 'Remove row redone',
        },
      })
      expect(_.map(collection.collection_cards, 'row')).toEqual([1, 2, 3])
    })
  })

  describe('API_fetchCardOrders', () => {
    const data = [{ id: '1', order: 2 }, { id: '2', order: 1 }]
    beforeEach(() => {
      collection.API_fetchAllCardIds = jest
        .fn()
        .mockReturnValue(Promise.resolve(data))

      runInAction(() => {
        collection.collection_cards = [collectionCard_1, collectionCard_2]
      })
    })

    it('should update the card orders based on the API response', async () => {
      expect(_.map(collection.collection_cards, 'id')).toEqual(['1', '2'])
      await collection.API_fetchCardOrders()
      expect(_.map(collection.collection_cards, 'id')).toEqual(['2', '1'])
    })
  })

  describe('API_fetchCardRoles', () => {
    beforeEach(() => {
      apiStore.request = jest.fn()
      runInAction(() => {
        collection.collection_cards = [
          collectionCard_1,
          collectionCard_2,
          collectionCard_3,
        ]
      })
    })

    it('should call apiStore to fetch any missing card roles', async () => {
      collection.collection_cards[0].record = { id: '11', roles: ['something'] }
      collection.collection_cards[1].record = { id: '12' }
      collection.collection_cards[2].record = { id: '13' }
      expect(_.map(collection.collection_cards, 'id')).toEqual(['1', '2', '3'])
      await collection.API_fetchCardRoles()
      expect(apiStore.request).toHaveBeenCalledWith(
        `collections/${collection.id}/collection_cards/roles?select_ids=2,3`
      )
    })
  })

  describe('API_fetchCardReviewerStatuses', () => {
    beforeEach(() => {
      apiStore.requestJson = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve([
            { user_id: '1', status: 'in_progress', record_id: '101' },
            { user_id: '2', status: 'in_progress', record_id: '101' },
          ])
        )
      runInAction(() => {
        collection.collection_cards = [collectionCard_1, collectionCard_2]
        collection.collection_cards[1].record.user_tag_list = ['something']
      })
    })

    it('calls reviewer_statuses endpoint', async () => {
      await collection.API_fetchCardReviewerStatuses()
      expect(apiStore.requestJson).toHaveBeenCalledWith(
        `collections/${collection.id}/collection_cards/reviewer_statuses?select_ids=${collectionCard_2.id}`
      )
    })
  })

  describe('mergeCards', () => {
    beforeEach(() => {
      runInAction(() => {
        collection.collection_cards = [collectionCard_1, collectionCard_3]
      })
    })

    it('should merge new cards with existing cards and sort them', () => {
      const data = [collectionCard_3, collectionCard_2]
      collection.mergeCards(data)
      expect(collection.collection_cards.length).toEqual(3)
      expect(_.map(collection.collection_cards, 'id')).toEqual(['1', '3', '2'])
    })
  })

  describe('sortedCards', () => {
    beforeEach(() => {
      runInAction(() => {
        collection.collection_cards = [
          collectionCard_1,
          collectionCard_2,
          collectionCard_3,
        ]
        _.assign(collection.collection_cards[0], {
          order: 3,
          row: 0,
          updated_at: 1,
        })
        _.assign(collection.collection_cards[1], {
          order: 1,
          row: 1,
          updated_at: 2,
        })
        _.assign(collection.collection_cards[2], {
          order: 2,
          row: 2,
          updated_at: 3,
        })
      })
    })

    it('should sort by order (if normal collection)', () => {
      expect(_.map(collection.sortedCards, 'id')).toEqual(['2', '3', '1'])
    })

    it('should sort by row/col (if board collection)', () => {
      collection.num_columns = 4
      expect(_.map(collection.sortedCards, 'id')).toEqual(['1', '2', '3'])
      collection.num_columns = null
    })

    it('should sort by date (if currentOrder is set)', () => {
      runInAction(() => {
        collection.currentOrder = 'updated_at'
      })
      expect(_.map(collection.sortedCards, 'id')).toEqual(['3', '2', '1'])
      runInAction(() => {
        collection.currentOrder = 'order'
      })
    })
  })

  describe('filter bar methods', () => {
    beforeEach(() => {
      collection.addReference(
        'collection_filters',
        [
          {
            filter_type: 'tag',
            text: 'plant',
          },
          {
            filter_type: 'tag',
            text: 'purpose',
          },
        ],
        {
          model: CollectionFilter,
          type: ReferenceType.TO_MANY,
        }
      )
      collection.name = 'Some Purposeful Plants'
    })

    it('filterBarFilters returns all collection filters', () => {
      expect(collection.filterBarFilters.map(f => f.text)).toEqual([
        'plant',
        'purpose',
      ])
    })

    it('methodLibraryFilters returns no filters', () => {
      expect(collection.methodLibraryFilters.map(f => f.text)).toEqual([])
    })

    describe('if method library collection', () => {
      beforeEach(() => {
        collection.parent.name = "Plant Organization's Method Library"
        collection.name = 'All Methods'
        expect(collection.isParentMethodLibrary).toEqual(true)
      })

      it('filterBarFilters returns non-method-library filters', () => {
        expect(collection.filterBarFilters.map(f => f.text)).toEqual(['plant'])
      })

      it('methodLibraryFilters returns method library filters', () => {
        expect(collection.methodLibraryFilters.map(f => f.text)).toEqual([
          'purpose',
        ])
      })
    })
  })

  describe('isPublicJoinable', () => {
    it('returns false if collection.anyone_can_join is false', () => {
      collection.anyone_can_join = false
      expect(collection.isPublicJoinable).toEqual(false)
    })
    it('returns true if collection.anyone_can_join is true', () => {
      collection.anyone_can_join = true
      expect(collection.isPublicJoinable).toEqual(true)
    })
  })

  describe('countSubmissions', () => {
    it('returns the count of submission live tests', () => {
      collection.type = 'Collection::SubmissionBox'
      collection.submissions_collection = fakeCollection
      expect(collection.countSubmissions).toEqual(
        collection.submissions_collection.collection_cards.length
      )
    })
  })

  describe('countSubmissionLiveTests', () => {
    beforeEach(() => {
      collection.type = 'Collection::SubmissionBox'
      fakeCollection.collection_cards.map(cc => {
        cc.record.isLiveTest = true
      })
      collection.submissions_collection = fakeCollection
    })

    it('returns the count of submission live tests', () => {
      expect(collection.countSubmissionLiveTests).toEqual(
        collection.submissions_collection.collection_cards.length
      )
    })
  })

  describe('reviewableCards', () => {
    beforeEach(() => {
      const reviewableCardAttrs = [
        {
          section_type: 'intro',
          card_question_type: 'question_open',
          record: { isLiveTest: true },
        },
      ]
      collection.type = 'Collection::SubmissionsCollection'
      collection.addReference('collection_cards', reviewableCardAttrs, {
        model: CollectionCard,
        type: ReferenceType.TO_MANY,
      })
    })

    it('returns reviewableCards', () => {
      expect(_.isEmpty(collection.reviewableCards)).toBe(false)
    })
  })

  describe('isCurrentUserAReviewer', () => {
    const handle = 'jappleseed'
    beforeEach(() => {
      collection = new Collection(
        {
          name: 'fakeCollection',
          roles: [fakeRole],
          organization_id: '1',
          parent: { name: 'Some Collection' },
          submission_attrs: {
            submission: true,
            test_status: 'live',
          },
          type: 'Collection::SubmissionsCollection',
          parentChallenge: {},
          user_tag_list: [handle],
          is_inside_a_challenge: true,
        },
        apiStore
      )
      const user = new User(
        {
          handle,
        },
        apiStore
      )
      updateModelId(user, '1')
      runInAction(() => {
        apiStore.currentUserId = '1'
      })
      apiStore.add(user, 'users')
    })

    it('should be true if inside a challenge', () => {
      expect(collection.isCurrentUserAReviewer).toBe(true)
    })
  })

  describe('allowsCollectionTypeSelector', () => {
    describe('when regular collection or board collection', () => {
      it('returns true', () => {
        collection.type = 'Collection'
        expect(collection.allowsCollectionTypeSelector).toEqual(true)
        collection.num_columns = 4
        expect(collection.allowsCollectionTypeSelector).toEqual(true)
      })

      describe('when profile template', () => {
        it('returns false', () => {
          collection.is_profile_template = true
          expect(collection.allowsCollectionTypeSelector).toEqual(false)
        })
      })

      describe('when profile collection', () => {
        it('returns false', () => {
          collection.is_profile_collection = true
          expect(collection.allowsCollectionTypeSelector).toEqual(false)
        })
      })

      describe('when shared collection', () => {
        it('returns false', () => {
          collection.type = 'Collection::SharedWithMeCollection'
          expect(collection.allowsCollectionTypeSelector).toEqual(false)
        })
      })

      describe('when system_required', () => {
        it('returns false', () => {
          collection.system_required = true
          expect(collection.allowsCollectionTypeSelector).toEqual(false)
        })
      })
    })
  })

  // describe('showFilters', () => {
  //   describe('searchCollection or submissionBox', () => {
  //     it('returns false', () => {
  //       collection.type = 'Collection::SearchCollection'
  //       expect(collection.showFilters).toEqual(false)
  //       collection.type = 'Collection::SubmissionBox'
  //       expect(collection.showFilters).toEqual(false)
  //     })
  //   })
  //
  //   describe('normal, board, submissions collection', () => {
  //     it('returns true', () => {
  //       collection.type = 'Collection'
  //       expect(collection.showFilters).toEqual(true)
  //       collection.type = 'Collection::Board'
  //       expect(collection.showFilters).toEqual(true)
  //       collection.type = 'Collection::SubmissionsCollection'
  //       expect(collection.showFilters).toEqual(true)
  //     })
  //   })
  // })
})
