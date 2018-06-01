import { action, observable, computed } from 'mobx'
import { Store } from 'mobx-jsonapi-store'
import _ from 'lodash'
import moment from 'moment-mini'

import Activity from './jsonApi/Activity'
import firestoreClient from '~/vendor/firestore'
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
import UsersThread from './jsonApi/UsersThread'

class ApiStore extends Store {
  @observable currentUserId = null
  @observable currentCommentThreadIds = []
  @observable currentPageThreadKey = null

  @action setCurrentUserId(id) {
    this.currentUserId = id
  }

  @action setCurrentPageThreadKey(key) {
    this.currentPageThreadKey = key
  }

  @action addCurrentCommentThread(id) {
    // no need to do anything if we're already on this thread
    if (this.currentCommentThreadIds.indexOf(id) > -1) return
    this.currentCommentThreadIds.push(id)
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

  // async fetchThreads() {
  //   // This is actually fetching the current user's / current org threads
  //   const res = await this.fetchAll('comment_threads')
  //   const threads = res.data
  //   const threadIds = []
  //   threads.forEach((thread) => {
  //     thread.importComments(thread.unread_comments, { unread: true })
  //     threadIds.push(thread.id)
  //   })
  //   runInAction(() => {
  //     // NOTE: we aren't currently doing pagination here, but when we do...
  //     // will probably do some kind of union/merge rather than replace
  //     this.currentCommentThreadIds.replace(threadIds)
  //   })
  // }

  importUsersThread({ usersThread, thread, comments } = {}) {
    thread.assignRef('users_thread', usersThread)
    thread.importComments(comments)
    this.addCurrentCommentThread(thread.id)
  }

  syncFromFirestore(data) {
    const timeFields = ['created_at', 'updated_at', 'last_viewed_at']
    _.each(data.data.attributes, (v, k) => {
      if (_.includes(timeFields, k)) {
        data.data.attributes[k] = v.toDate()
      }
    })
    _.each(data.included, d => {
      _.each(d.attributes, (v, k) => {
        if (_.includes(timeFields, k)) {
          d.attributes[k] = v.toDate()
        }
      })
    })
    return this.sync(data)
  }

  findThreadForRecord(record) {
    let thread = null
    // look within our local store
    this.findAll('comment_threads').forEach(ct => {
      if (ct.record && ct.record.id === record.id) {
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
          // thread.importComments(thread.unread_comments, { unread: true })
        } else {
          // if still not found, set up a new empty record
          thread = new CommentThread({
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
    this.setCurrentPageThreadKey(thread.key)
    return thread
  }

  @computed get currentThreads() {
    return _.filter(
      _.sortBy(this.findAll('comment_threads'), t => moment(t.updated_at)),
      t => {
        // don't include any new records that are being constructed
        if (!t.record || !t.record.id) return false
        // include the current page thread even if you're not following
        if (t.key === this.currentPageThreadKey) return true
        return this.currentCommentThreadIds.indexOf(t.id) > -1
      }
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
  UsersThread,
]

export default ApiStore
