import Collection from '~/stores/jsonApi/Collection'

import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeRole, fakeUser } from '#/mocks/data'

// https://stackoverflow.com/questions/47402005/jest-mock-how-to-mock-es6-class-default-import-using-factory-parameter/47502477#47502477
jest.mock('../../../app/javascript/stores/ApiStore', () =>
  jest.fn().mockImplementation(() => {})
)

describe('Collection', () => {
  let collection

  beforeEach(() => {
    collection = new Collection(
      {
        name: 'fakeCollection',
        roles: [fakeRole],
        organization_id: '4',
      },
      fakeApiStore()
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

  describe('checkCurrentOrg', () => {
    let user
    describe('when the org id is different from the current users org', () => {
      it('should call switchOrganization on the collection', () => {
        user = fakeUser
        user.current_organization = { id: '3' }
        collection.meta.collection.currentUser = user
        collection.checkCurrentOrg()
        expect(user.switchOrganization).toHaveBeenCalledWith(
          collection.organization_id
        )
      })
    })

    describe('when the org id is the same as the current users org', () => {
      it('should call switchOrganization on the collection', () => {
        user.switchOrganization.mockClear()
        user = fakeUser
        user.current_organization = { id: '4' }
        collection.meta.collection.currentUser = user
        collection.checkCurrentOrg()
        expect(user.switchOrganization).not.toHaveBeenCalledWith(
          collection.organization_id
        )
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
})
