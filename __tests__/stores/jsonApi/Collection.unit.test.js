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

  describe('userCanEdit', () => {
    describe('on a non-normal collection', () => {
      it('should return false because it is not editable', () => {
        collection.type = 'Collection::SharedWithMeCollection'
        expect(collection.userCanEdit(1)).toBeFalsy()
        collection.type = 'Collection::UserCollection'
        expect(collection.userCanEdit(1)).toBeFalsy()
      })
    })

    describe('when there are no users on the colleciton that can edit', () => {
      beforeEach(() => {
        collection.roles.push({
          canEdit: jest.fn().mockReturnValue(false)
        })
      })

      it('should return false', () => {
        expect(collection.userCanEdit(1)).toBeFalsy()
      })
    })

    describe('when there are users on the collection that can edit', () => {
      beforeEach(() => {
        collection.roles.push({
          users: [{ id: 3 }],
          canEdit: jest.fn().mockReturnValue(true),
        })
      })

      it('should return true', () => {
        expect(collection.userCanEdit(3)).toBeTruthy()
      })
    })
  })
})
