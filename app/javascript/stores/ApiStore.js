import { action, observable, computed } from 'mobx'
import { Store } from 'mobx-jsonapi-store'
import _ from 'lodash'
import moment from 'moment-mini'

import Activity from './jsonApi/Activity'
import Collection from './jsonApi/Collection'
import CollectionCard from './jsonApi/CollectionCard'
import Role from './jsonApi/Role'
import FilestackFile from './jsonApi/FilestackFile'
import Group from './jsonApi/Group'
import Item from './jsonApi/Item'
import Notification from './jsonApi/Notification'
import Organization from './jsonApi/Organization'
import User from './jsonApi/User'
import Comment from './jsonApi/Comment'
import CommentThread from './jsonApi/CommentThread'

class ApiStore extends Store {
  @observable currentUserId = null

  @action setCurrentUserId(id) {
    this.currentUserId = id
  }

  @computed get currentUser() {
    return this.find('users', this.currentUserId)
  }

  get currentUserOrganizationId() {
    if (!this.currentUser.current_organization) return null
    return this.currentUser.current_organization.id
  }

  get currentUserOrganization() {
    return this.currentUser.current_organization
  }

  findOrganizationById(id) {
    return _.first(this.currentUser.organizations.filter(org => org.id === id))
  }

  async loadCurrentUserAndGroups() {
    await this.loadCurrentUser()
    await this.loadCurrentUserGroups()
  }

  async loadCurrentUser() {
    try {
      const res = await this.request('users/me')
      this.setCurrentUserId(res.data.id)
    } catch (e) {
      console.warn(e)
    }
  }

  async loadCurrentUserGroups({ orgOnly = false } = {}) {
    try {
      let { groups } = this.currentUser
      if (orgOnly) {
        groups = groups.filter(g => g.isOrgGroup)
      }
      groups.map(group => this.fetchRoles(group))
    } catch (e) {
      console.warn(e)
    }
  }

  async fetchRoles(group) {
    const res = await this.request(`groups/${group.id}/roles`, 'GET')
    const roles = res.data
    this.add(roles, 'roles')
  }

  async fetchThreads() {
    // this.findAll('comment_threads')
    return this.fetchAll('comment_threads')
  }

  findThreadForRecord(record) {
    let thread = null
    // look within our local store
    this.findAll('comment_threads').forEach(ct => {
      if (ct.record.id === record.id) {
        thread = ct
      }
    })
    return thread
  }

  clearUnpersistedThreads() {
    this.findAll('comment_threads').forEach(ct => {
      // remove any old threads that didn't get persisted
      if (!ct.__persisted) {
        this.__removeModels([ct])
      }
    })
  }

  async findOrBuildCommentThread(record) {
    let thread = this.findThreadForRecord(record)
    this.clearUnpersistedThreads()
    if (!thread) {
      // first search for it via API
      try {
        const res = await this.request(
          `comment_threads/find_by_record/${record.className}/${record.id}`,
          'GET'
        )
        if (res.data && res.data.id) {
          thread = res.data
        } else {
          // if still not found, set up a new empty record
          thread = new CommentThread({
            // assign a fake id so that it has a unique key
            id: `new-${record.id}-${record.internalType}`,
            record_id: record.id,
            record_type: record.className,
            updated_at: new Date()
          }, this)
          thread.assignRef('record', record)
          this.add(thread)
        }
      } catch (e) {
        console.warn(e)
      }
    }
    return thread
  }

  @computed get currentThreads() {
    return _.filter(
      _.sortBy(this.findAll('comment_threads'), t => moment(t.updated_at)),
      t => t.record && t.record.id
    )
  }

  async fetchNotifications() {
    const res = await this.fetchAll('notifications')
    return res.data
  }

  // -- override mobx-jsonapi-store --
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
  Activity,
  Collection,
  CollectionCard,
  FilestackFile,
  Group,
  Item,
  Role,
  Organization,
  User,
  Comment,
  CommentThread,
  Notification,
]

export default ApiStore
