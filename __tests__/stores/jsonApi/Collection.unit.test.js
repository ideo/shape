import { apiStore } from '~/stores'
import Collection from '~/stores/jsonApi/Collection'

import fakeApiStore from '#/mocks/fakeApiStore'

import {
  fakeRole,
  fakeUser,
} from '#/mocks/data'

describe('Collection', () => {
  let collection

  beforeEach(() => {
    collection = new Collection({
      name: 'fakeCollection',
      roles: [fakeRole],
      organization_id: 4,
    }, fakeApiStore())
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

  describe('checkCurrentOrg', () => {
    let user

    beforeEach(() => {
      user = fakeUser
      user.current_organization = { id: 3 }
      collection.__collection = { currentUser: user }
      collection.checkCurrentOrg()
    })

    describe('when the org id is different from the current users org', () => {
      it('should call switchOrganization on the collection', () => {
        expect(user.switchOrganization).toHaveBeenCalledWith(
          collection.organization_id,
        )
      })
    })
  })
})
