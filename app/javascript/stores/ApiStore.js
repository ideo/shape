import { action, runInAction, observable, computed } from 'mobx'
import { Collection as datxCollection, assignModel, ReferenceType } from 'datx'
import { jsonapi } from 'datx-jsonapi'
import _ from 'lodash'
import moment from 'moment-mini'
import * as Sentry from '@sentry/browser'
import queryString from 'query-string'

import { apiUrl } from '~/utils/url'
import trackError from '~/utils/trackError'
import googleTagManager from '~/vendor/googleTagManager'

import Activity from './jsonApi/Activity'
import Audience from './jsonApi/Audience'
import Collection from './jsonApi/Collection'
import CollectionCard from './jsonApi/CollectionCard'
import DataItemsDataset from './jsonApi/DataItemsDataset'
import Dataset from './jsonApi/Dataset'
import Comment from './jsonApi/Comment'
import CommentThread from './jsonApi/CommentThread'
import FilestackFile from './jsonApi/FilestackFile'
import Group from './jsonApi/Group'
import Item from './jsonApi/Item'
import Notification from './jsonApi/Notification'
import Organization from './jsonApi/Organization'
import QuestionAnswer from './jsonApi/QuestionAnswer'
import Role from './jsonApi/Role'
import SurveyResponse from './jsonApi/SurveyResponse'
import TestAudience from './jsonApi/TestAudience'
import User from './jsonApi/User'
import UsersThread from './jsonApi/UsersThread'

class ApiStore extends jsonapi(datxCollection) {
  @observable
  currentUserId = null
  @observable
  sessionLoaded = false

  @observable
  currentUserOrganizationId = null

  @observable
  currentCommentThreadIds = []

  @observable
  usersThreadPagesToLoad = 1
  @observable
  loadingThreads = false
  @observable
  hasOlderThreads = false
  @observable
  currentPageThreadKey = null

  @observable
  recentNotifications = new Map()

  @observable
  usableTemplates = []

  @observable
  shapeAdminUsers = []

  // doesn't have any need to be observable...
  filestackToken = {}
  filestackTokenInterval = null

  constructor({ routingStore, uiStore, undoStore } = {}) {
    super()
    this.routingStore = routingStore
    this.uiStore = uiStore
    this.undoStore = undoStore
  }

  fetch(type, id, skipCache = false) {
    return super.fetch(type, id, { skipCache })
  }

  request(path, method, data, options = {}) {
    if (!_.has(options, 'skipCache')) {
      options.skipCache = true
    }
    return super.request(apiUrl(path), method, data, options)
  }

  async requestJson(path, method, data, options = {}) {
    const res = await this.request(path, method, data, options)
    return res.__response.data
  }

  @action
  setCurrentUserInfo({ id, filestackToken, organizationId }) {
    this.currentUserId = id
    this.filestackToken = filestackToken
    this.currentUserOrganizationId = organizationId || null
    Sentry.configureScope(scope => {
      scope.setUser({ id: id, currentOrganizationId: organizationId })
    })
  }

  @action
  setCurrentPageThreadKey(key) {
    this.currentPageThreadKey = key
  }

  @action
  loadNextThreadPage() {
    this.update('loadingThreads', true)
    // this triggers an observable reaction in firestore.js
    // and then hasOlderThreads will potentially get set to true/false
    this.usersThreadPagesToLoad += 1
  }

  @action
  addCurrentCommentThread(id) {
    // no need to do anything if we're already on this thread
    if (this.currentCommentThreadIds.indexOf(id) > -1) return
    this.currentCommentThreadIds.push(id)
  }

  @computed
  get currentUser() {
    if (!this.currentUserId) {
      return null
    }
    return this.find('users', this.currentUserId)
  }

  @computed
  get currentUserOrganization() {
    if (!this.currentUserOrganizationId) {
      return null
    }
    return this.find('organizations', this.currentUserOrganizationId)
  }

  get currentUserCollectionId() {
    const { currentUser } = this
    if (!this.currentUser) return null
    return currentUser.current_user_collection_id
  }

  @computed
  get currentOrgIsDeactivated() {
    if (!this.currentUser) return false
    const org =
      this.currentUserOrganization || this.currentUser.current_organization
    if (!org) return false
    return org.deactivated
  }

  @computed
  get currentOrgSlug() {
    if (!this.currentUserOrganization) return ''
    return this.currentUserOrganization.slug
  }

  findOrganizationById(id) {
    return _.first(this.currentUser.organizations.filter(org => org.id === id))
  }

  async loadCurrentUser({ onSuccess } = {}) {
    try {
      const res = await this.request('users/me')
      const currentUser = res.data
      if (currentUser.id) {
        this.setCurrentUserInfo({
          id: currentUser.id,
          organizationId:
            currentUser.current_organization &&
            currentUser.current_organization.id,
        })
        if (_.isFunction(onSuccess)) onSuccess(currentUser)
      }
      this.update('sessionLoaded', true)
    } catch (e) {
      trackError(e, { source: 'loadCurrentUser', name: 'fetchUser' })
    }
  }

  async createLimitedUser({ contactInfo, sessionUid }) {
    try {
      const res = await this.request('users/create_limited_user', 'POST', {
        contact_info: contactInfo,
        session_uid: sessionUid,
      })
      return res
    } catch (e) {
      trackError(e, { source: 'createLimitedUser' })
    }
  }

  checkCurrentOrg({ id = '', slug = '' } = {}) {
    const doesNotMatch =
      (id && this.currentUserOrganizationId !== id) ||
      (slug && this.currentOrgSlug !== slug)
    if (doesNotMatch) {
      this.loadCurrentUser()
    }
  }

  checkJoinableGroup(id) {
    if (!this.currentUser) return
    const { groups } = this.currentUser
    if (!_.includes(_.map(groups, 'id'), id)) {
      this.loadCurrentUser()
    }
  }

  searchUsersAndGroups(query) {
    return this.request(`search/users_and_groups?query=${query}`)
  }

  searchUsers(query) {
    return this.request(
      `search/users_and_groups?query=${query}&users_only=true`
    )
  }

  searchGroups(query) {
    return this.request(
      `search/users_and_groups?query=${query}&groups_only=true`
    )
  }

  searchOrganizations(query) {
    return this.request(`search/organizations?query=${query}`)
  }

  // TODO rename searchRecords?
  searchCollections(params) {
    const defaultParams = { query: '' }
    return this.request(
      `organizations/${this.currentOrgSlug}/search?${queryString.stringify(
        _.merge(defaultParams, params)
      )}`
    )
  }

  async fetchRoles(resource) {
    const res = await this.request(
      `${resource.internalType}/${resource.id}/roles`,
      'GET'
    )
    const roles = res.data
    resource.roles = roles
    this.add(roles, 'roles')
    return roles
  }

  @action
  async fetchShapeAdminUsers() {
    const res = await this.request('admin/users')
    const adminUsers = _.sortBy(res.data, ['first_name'])
    runInAction(() => {
      this.shapeAdminUsers = adminUsers
    })
    return adminUsers
  }

  @action
  async removeShapeAdminUser(user) {
    await this.request(`admin/users/${user.id}`, 'DELETE')
    runInAction(() => {
      _.remove(this.shapeAdminUsers, u => u.id === user.id)
    })

    if (user.isCurrentUser) {
      window.location.href = '/'
    }
  }

  @action
  async addShapeAdminUsers(users, opts) {
    const userIds = users.map(user => user.id)
    const data = { user_ids: userIds, sendInvites: opts.sendInvites }
    await this.request('admin/users', 'POST', data)
    runInAction(() => {
      this.shapeAdminUsers = _.sortBy(this.shapeAdminUsers.concat(users), [
        'first_name',
      ])
    })
  }

  async searchForRespondents(audienceId, numRespondents) {
    const url = `admin/users/search?audience_id=${audienceId}&num_respondents=${numRespondents}`
    const res = await this.request(url)
    return res.data
  }

  async fetchTestCollections(page = 1) {
    const res = await this.request(`admin/test_collections?page=${page}`)
    return {
      data: res.data,
      totalPages: parseInt(res.headers.get('X-Total-Pages')),
    }
  }

  @action
  importUsersThread({ usersThread, thread, comments } = {}) {
    thread.addReference('users_thread', usersThread, {
      model: UsersThread,
      type: ReferenceType.TO_ONE,
    })
    thread.importComments(comments)
    this.addCurrentCommentThread(thread.id)
  }

  @computed
  get unreadNotifications() {
    return _.reverse(
      _.sortBy(
        this.findAll('notifications').filter(
          notification => !notification.read
        ),
        'created_at'
      )
    )
  }

  @computed
  get notifications() {
    return this.findAll('notifications')
  }

  @computed
  get unreadNotificationsCount() {
    return this.unreadNotifications.length
  }

  @action
  addRecentNotification(notification) {
    if (this.recentNotifications.has(notification.id)) return
    if (!notification.read) {
      this.recentNotifications.set(notification.id, notification)
    }
    setTimeout(() => {
      runInAction(() => {
        this.recentNotifications.set(notification.id, null)
      })
    }, 3000)
  }

  @computed
  get unreadCommentsCount() {
    if (!this.currentThreads) return 0
    return this.currentThreads.reduce(
      (acc, thread) => acc + thread.unreadCount,
      0
    )
  }

  @computed
  get unreadActivityCount() {
    return this.unreadCommentsCount + this.unreadNotificationsCount
  }

  massageFirestoreData = data => {
    const timeFields = ['created_at', 'updated_at', 'last_viewed_at']
    // id should no longer be an attribute
    delete data.attributes.id
    _.each(data.attributes, (v, k) => {
      if (_.includes(timeFields, k)) {
        data.attributes[k] = v.toDate()
      }
      if (k.indexOf('_id') > 0) {
        data.attributes[k] = v ? v.toString() : v
      }
    })
    return data
  }

  syncFromFirestore(data) {
    data.data = this.massageFirestoreData(data.data)
    _.each(data.included, (v, k) => {
      data.included[k] = this.massageFirestoreData(v)
    })
    return this.sync(data)
  }

  findThreadForRecord(record) {
    if (!record) return null
    let thread = null
    // look within our local store
    this.findAll('comment_threads').forEach(ct => {
      if (ct.record && ct.record.id === record.id) {
        thread = ct
      }
    })
    return thread
  }

  @action
  clearUnpersistedThreads() {
    this.findAll('comment_threads').forEach(ct => {
      // remove any old threads that didn't get persisted
      if (!ct.persisted) {
        this.__removeModel(ct)
      }
    })
    this.setCurrentPageThreadKey(null)
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
          // make sure to fetch the first page of comments
          thread.API_fetchComments()
        } else {
          // if still not found, set up a new empty record
          thread = new CommentThread(
            {
              record_id: record.id,
              record_type: record.className,
              updated_at: new Date(),
            },
            this
          )
          thread.addReference('record', record, {
            model: record.className === 'Collection' ? Collection : Item,
            type: ReferenceType.TO_ONE,
          })
          this.add(thread)
        }
      } catch (e) {
        trackError(e, {
          source: 'findOrBuildCommentThread',
          name: 'fetchThreads',
        })
      }
    }
    this.setCurrentPageThreadKey(thread.key)
    return thread
  }

  @computed
  get currentThreads() {
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

  fetchOrganizationAudiences(orgId) {
    // removeAll first, in case you had switched orgs
    this.removeAll('audiences')
    return this.request(`organizations/${orgId}/audiences`, 'GET')
  }

  createTemplateInstance(data) {
    return this.request('collections/create_template', 'POST', data)
  }

  async fetchAllPages(url, page = 1, acc = []) {
    // {page: 1, total: 15, size: 10}
    const res = await this.request(`${url}&page=${page}`)
    const { links } = res
    const all = [...acc, ...res.data]
    if (links.last === page) return all
    return this.fetchAllPages(url, page + 1, all)
  }

  async fetchUsableTemplates() {
    let q = `#template`
    q = _.trim(q)
      .replace(/\s/g, '+')
      .replace(/#/g, '%23')
    // TODO: pagination?
    const templates = await this.fetchAllPages(
      `organizations/${this.currentOrgSlug}/search?query=${q}&per_page=50`
    )
    runInAction(() => {
      this.usableTemplates = templates.filter(c => c.isUsableTemplate)
    })
  }

  async archiveCards({ cardIds, collection, undoable = true }) {
    const archiveResult = await this.request(
      'collection_cards/archive',
      'PATCH',
      {
        card_ids: cardIds,
      }
    )
    if (undoable) {
      const snapshot = collection.toJsonApiWithCards()
      this.undoStore.pushUndoAction({
        message: 'Delete undone',
        apiCall: () => this.unarchiveCards({ cardIds, snapshot }),
        redirectPath: { type: 'collections', id: collection.id },
      })
    }
    collection.removeCardIds(cardIds)
    return archiveResult
  }

  async unarchiveCards({ cardIds, snapshot }) {
    const res = await this.request('collection_cards/unarchive', 'PATCH', {
      card_ids: cardIds,
      collection_snapshot: snapshot,
    })
    const collection = res.data
    collection.API_fetchCards()
  }

  async moveCards(data, { undoSnapshot = {} } = {}) {
    // trigger card_mover in backend
    const res = await this.request('collection_cards/move', 'PATCH', data)

    // revert data if undoing card move
    if (!_.isEmpty(undoSnapshot)) {
      await this.request(`collections/${data.to_id}`, 'PATCH', {
        data: undoSnapshot,
      })
      const toCollection = this.find('collections', data.to_id)
      await toCollection.API_fetchCards()
      return
    }

    // find origin collection
    const fromCollection = this.find('collections', data.from_id)
    // make snapshot of fromCollection data with cards for potential undo
    const originalData = fromCollection.toJsonApiWithCards()
    // update UI for collection that cards were moved away from
    await fromCollection.API_fetchCards()

    // reverse to and from values for potential undo operation
    const reversedData = Object.assign({}, data, {
      to_id: data.from_id,
      from_id: data.to_id,
    })

    // add undo operation to stack so users can undo moving cards
    this.undoStore.pushUndoAction({
      message: 'Move undone',
      apiCall: async () => {
        await this.moveCards(reversedData, {
          undoSnapshot: originalData,
        })
      },
      redirectPath: {
        type: 'collections',
        id: fromCollection.id,
      },
    })

    return res
  }

  linkCards(data) {
    return this.request('collection_cards/link', 'POST', data)
  }

  async duplicateCards(data) {
    const res = await this.request('collection_cards/duplicate', 'POST', data)
    const collection = this.find('collections', data.to_id)
    this.undoStore.pushUndoAction({
      message: 'Duplicate undone',
      apiCall: () =>
        this.archiveCards({
          cardIds: res.meta.new_cards,
          collection,
          undoable: false,
        }),
      redirectPath: { type: 'collections', id: collection.id },
    })
    return res
  }

  async checkInMyCollection(record) {
    const inMyCollection = await this.requestJson(
      `${record.internalType}/${record.id}/in_my_collection`
    )
    runInAction(() => {
      record.inMyCollection = inMyCollection
    })
  }

  async searchRoles(
    record,
    { page = 1, query = '', status = 'active', reset = false } = {}
  ) {
    const params = queryString.stringify({
      query,
      page,
      status,
      resource_id: record.id,
      resource_type: record.className,
    })
    const apiPath = `search/users_and_groups?${params}`
    _.each(record.roles, role => {
      role.capturePrevLists({ reset })
    })
    try {
      const res = await this.request(apiPath)
      const roles = res.data

      // role records may have changed if this collection/item was just unanchored
      const roleIds = _.map(roles, 'id')
      const recordRoleIds = _.map(record.roles, 'id')

      // if the record doesn't have any roles yet -- or they have changed -- make the association
      if (!record.roles.length || _.difference(roleIds, recordRoleIds).length) {
        record.roles = roles
      }
      _.each(roles, role => {
        role.updateCount(status, res.meta.total)
        // first page load should automatically set role.users and role.groups via datx
        // next page loads we need to manually concatenate
        if (!reset) {
          role.mergePrevLists()
        }
      })
    } catch (e) {
      console.warn('Error with searchRoles', e.message)
    }
  }

  async checkCurrentOrganizationPayments() {
    const { has_payment_method } = this.currentUserOrganization
    const res = await this.request(
      `organizations/${this.currentUserOrganizationId}/check_payments`
    )
    const org = res.data
    if (!has_payment_method && org.has_payment_method) {
      // payment method was successfully added
      googleTagManager.push({
        event: 'formSubmission',
        formType: 'Added Payment Method',
      })
    }
    return org
  }

  get currentOrganization() {
    return this.currentUser.current_organization
  }

  // default action for updating any basic apiStore value
  @action
  update(name, value) {
    this[name] = value
  }

  // NOTE: had to override datx PureCollection, it looks like it is meant to do
  // what's listed below but it was trying to do `this.find(obj, id)` with no id
  remove(obj, id) {
    if (typeof obj === 'object') {
      runInAction(() => {
        this.__removeModel(obj)
      })
    } else {
      super.remove(obj, id)
    }
  }

  // -- override datx-jsonapi to deal with empty arrays --
  __updateRelationships(obj) {
    const record = this.find(obj.type, obj.id)
    const refs = obj.relationships ? Object.keys(obj.relationships) : []
    refs.forEach(ref => {
      const items = obj.relationships[ref].data
      if (items instanceof Array && items.length < 1) {
        /* NOTE: special case, if relationship data comes back with an empty array
         * we have to manually empty the array, while also assigning the proper type
         */
        const possibleTypes = _.map(ApiStore.types, model => model.type)
        if (possibleTypes.indexOf(ref) > -1) {
          assignModel(record, ref, observable([]))
        }
      }
    })
    return super.__updateRelationships(obj)
  }
}
ApiStore.types = [
  Activity,
  Audience,
  Collection,
  CollectionCard,
  Comment,
  CommentThread,
  Dataset,
  DataItemsDataset,
  FilestackFile,
  Group,
  Item,
  Notification,
  Organization,
  QuestionAnswer,
  Role,
  SurveyResponse,
  TestAudience,
  User,
  UsersThread,
]

export default ApiStore
