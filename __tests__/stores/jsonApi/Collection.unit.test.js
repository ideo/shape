import { apiStore } from '~/stores'
import Collection from '~/stores/jsonApi/Collection'

import fakeApiStore from '#/mocks/fakeApiStore'

import {
  fakeRole,
} from '#/mocks/data'

describe('Collection', () => {
  let collection

  beforeEach(() => {
    collection = new Collection({
      name: 'fakeCollection',
      roles: [fakeRole],
    }, fakeApiStore)
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
})
