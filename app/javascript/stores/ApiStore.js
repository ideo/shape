import { action, observable, computed } from 'mobx'
import { Store } from 'mobx-jsonapi-store'
import _ from 'lodash'

import Collection from './jsonApi/Collection'
import CollectionCard from './jsonApi/CollectionCard'
import Role from './jsonApi/Role'
import FilestackFile from './jsonApi/FilestackFile'
import Group from './jsonApi/Group'
import Item from './jsonApi/Item'
import Organization from './jsonApi/Organization'
import User from './jsonApi/User'

class ApiStore extends Store {
  @observable currentUserId = null

  @action setCurrentUserId(id) {
    this.currentUserId = id
  }

  @computed get currentUser() {
    return this.find('users', this.currentUserId)
  }

  get currentUserOrganization() {
    if (!this.currentUser.current_organization) return null
    return this.currentUser.current_organization
  }

  get currentUserOrganizationId() {
    if (!this.currentUser.current_organization) return null
    return this.currentUser.current_organization.id
  }

  get currentUserOrganization() {
    return this.currentUser.current_organization
  }

  __updateRelationships(obj) {
    const record = this.find(obj.type, obj.id)
    const refs = obj.relationships ? Object.keys(obj.relationships) : []
    refs.forEach((ref) => {
      const items = obj.relationships[ref].data
      if (items instanceof Array && items.length < 1) {
        /* NOTE: special case, if relationship data comes back with an empty array
         * we have to manually empty the array, while also assigning the proper type
         */
        const possibleTypes = _.map(ApiStore.types, model => model.type)
        if (possibleTypes.indexOf(ref) > -1) {
          record.assignRef(ref, observable([]), ref)
        }
      }
    })
    super.__updateRelationships(obj)
  }
}
ApiStore.types = [
  Collection,
  CollectionCard,
  FilestackFile,
  Group,
  Item,
  Role,
  Organization,
  User,
]

export default ApiStore
