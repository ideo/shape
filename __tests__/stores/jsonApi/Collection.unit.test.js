import _ from 'lodash'
import { ReferenceType } from 'datx'
// apiStore must be imported first
// or else you run into a circular dependency issue
import { apiStore } from '~/stores'
import Collection from '~/stores/jsonApi/Collection'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import googleTagManager from '~/vendor/googleTagManager'

import { fakeRole } from '#/mocks/data'
jest.mock('../../../app/javascript/vendor/googleTagManager')

describe('Collection', () => {
  let collection

  beforeEach(() => {
    collection = new Collection(
      {
        name: 'fakeCollection',
        roles: [fakeRole],
        organization_id: '4',
      },
      apiStore
    )
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
      it('pushes a feedback test launch event to google tag manager', () => {
        collection.trackTestAction('launch')

        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: 'launch Feedback Test',
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
})
