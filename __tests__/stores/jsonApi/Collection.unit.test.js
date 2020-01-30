import _ from 'lodash'
import { runInAction } from 'mobx'
import { ReferenceType, updateModelId } from 'datx'

// apiStore must be imported first
// or else you run into a circular dependency issue
import { apiStore } from '~/stores'
import Collection from '~/stores/jsonApi/Collection'
import Organization from '~/stores/jsonApi/Organization'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import googleTagManager from '~/vendor/googleTagManager'

import { fakeRole } from '#/mocks/data'
jest.mock('../../../app/javascript/vendor/googleTagManager')

const collectionCard_1 = new CollectionCard()
updateModelId(collectionCard_1, '1')
const collectionCard_2 = new CollectionCard()
updateModelId(collectionCard_2, '2')
const collectionCard_3 = new CollectionCard()
updateModelId(collectionCard_3, '3')

describe('Collection', () => {
  let collection, organization

  beforeEach(() => {
    collection = new Collection(
      {
        name: 'fakeCollection',
        roles: [fakeRole],
        organization_id: '1',
        style: {},
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
          organization: 'MyOrg',
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
    beforeEach(() => {
      runInAction(() => {
        collectionCard_1.row = 0
        collection.class_type = 'Collection::Board'
        collection.collection_cards = [collectionCard_1, collectionCard_2]
      })
    })
    it('should call apiStore and apply local updates', () => {
      expect(collectionCard_1.row).toEqual(0)
      const updates = [{ card: collectionCard_1, row: 2, col: 3 }]
      collection.API_batchUpdateCardsWithUndo({
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
})
