import { action, runInAction, observable, computed } from 'mobx'
import {
  Collection as datxCollection,
  assignModel,
  updateModelId,
  ReferenceType,
} from 'datx'
import { jsonapi } from 'datx-jsonapi'
import _ from 'lodash'
import moment from 'moment-mini'
import * as Sentry from '@sentry/browser'
import queryString from 'query-string'

import { apiUrl } from '~/utils/url'
import trackError from '~/utils/trackError'
import IdeoSSO from '~/utils/IdeoSSO'
import googleTagManager from '~/vendor/googleTagManager'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'

import Activity from './jsonApi/Activity'
import Audience from './jsonApi/Audience'
import Collection from './jsonApi/Collection'
import CollectionCard from './jsonApi/CollectionCard'
import CollectionFilter from './jsonApi/CollectionFilter'
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
import QuestionChoice from './jsonApi/QuestionChoice'
import Tag from './jsonApi/Tag'

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
    _.each(['routingStore', 'uiStore', 'undoStore'], store => {
      // also save reference back to itself for the stores to use
      this[store].apiStore = this
    })
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
      scope.setUser({ id, currentOrganizationId: organizationId })
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

  get currentUserOrganizationName() {
    const { currentUserOrganization } = this
    return currentUserOrganization ? currentUserOrganization.name : null
  }

  get currentUserCollectionId() {
    const { currentUser } = this
    if (!this.currentUser) return null
    return currentUser.current_user_collection_id
  }

  get currentOrganization() {
    return this.currentUser.current_organization
  }

  @computed
  get currentOrgIsDeactivated() {
    if (!this.currentUser) return false
    const org = this.currentUserOrganization || this.currentOrganization
    if (!org) return false
    return org.deactivated
  }

  @computed
  get currentOrgSlug() {
    if (!this.currentUserOrganization) return ''
    return this.currentUserOrganization.slug
  }

  @computed
  get audiences() {
    return this.findAll('audiences')
  }

  findOrganizationById(id) {
    return _.first(this.currentUser.organizations.filter(org => org.id === id))
  }

  async loadCurrentUser({ onSuccess, checkIdeoSSO = false } = {}) {
    if (checkIdeoSSO) {
      try {
        await IdeoSSO.getUserInfo()
      } catch {
        IdeoSSO.logout('/login')
        return
      }
    }
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

  createLimitedUser({ contactInfo, feedbackContactPreference, sessionUid }) {
    return this.request('users/create_limited_user', 'POST', {
      contact_info: contactInfo,
      feedback_contact_preference: feedbackContactPreference,
      session_uid: sessionUid,
    })
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

  searchUsersAndGroups(params = {}) {
    // possible params: query, per_page, users_only, groups_only
    const defaultParams = { query: '' }
    return this.request(
      `search/users_and_groups?${queryString.stringify(
        _.merge(defaultParams, params)
      )}`
    )
  }

  searchUsers({ query }) {
    return this.searchUsersAndGroups({ query, users_only: true })
  }

  searchGroups({ query }) {
    return this.searchUsersAndGroups({ query, groups_only: true })
  }

  searchOrganizations(query) {
    return this.request(`search/organizations?query=${query}`)
  }

  // TODO rename searchRecords?
  searchCollections(params = {}) {
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
  get selectedCards() {
    const { uiStore } = this
    const { selectedCardIds } = uiStore
    return this.findAll('collection_cards').filter(
      card => selectedCardIds.indexOf(card.id) > -1
    )
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
      const { type, id } = v
      if (this.find(type, id)) {
        // only sync things that aren't already in apiStore (as that should already be more accurate)
        delete data.included[k]
      } else {
        data.included[k] = this.massageFirestoreData(v)
      }
    })
    return this.sync(data)
  }

  findThreadForRecord(record) {
    if (!record) return null
    let thread = null
    // look within our local store
    this.findAll('comment_threads').forEach(ct => {
      if (ct.record && ct.record === record) {
        thread = ct
      }
    })
    return thread
  }

  @action
  clearUnpersistedThreads({ keepRecord } = {}) {
    this.findAll('comment_threads').forEach(ct => {
      // remove any old threads that didn't get persisted
      if (!ct.persisted && (!keepRecord || ct.record !== keepRecord)) {
        this.__removeModel(ct)
      }
    })
    this.setCurrentPageThreadKey(null)
  }

  async setupCommentThreadAndMenusForPage(
    record,
    { initialPageLoad = true } = {}
  ) {
    const { uiStore, routingStore, currentUser } = this
    if (!currentUser) {
      return
    }
    if (uiStore.activityLogOpen) {
      this.update('loadingThreads', true)
      const thread = await this.findOrBuildCommentThread(record)
      runInAction(() => {
        uiStore.expandThread(thread.key)
        this.update('loadingThreads', false)
      })
    }
    if (initialPageLoad && !_.isEmpty(routingStore.query)) {
      // This must run after findOrBuildCommentThread,
      // as it needs that if displaying in-collection test
      uiStore.openOptionalMenus(routingStore.query)
    }
  }

  async expandAndOpenThreadForRecord(record) {
    const { uiStore } = this
    const { viewingRecord } = uiStore
    if (!viewingRecord) return
    if (viewingRecord.isUserCollection) {
      uiStore.alert('Commenting not available from My Collection')
      uiStore.setCommentingOnRecord(null)
      return
    }
    const thread = await this.findOrBuildCommentThread(viewingRecord)
    uiStore.expandAndOpenThread(thread.key)
  }

  openCurrentThreadToCommentOn(record) {
    const { uiStore } = this
    this.expandAndOpenThreadForRecord(record)
    if (uiStore.commentingOnRecord !== record) {
      // when previous thread is not the same as the current thread
      this.collapseReplies()
      uiStore.scrollToBottomOfComments()
    }
    uiStore.setCommentingOnRecord(record)
  }

  async openCommentFromHighlight(commentId) {
    const { uiStore } = this

    const comment = this.find('comments', commentId)
    let thread = null
    if (comment) {
      thread = this.find('comment_threads', comment.comment_thread_id)
    }
    if (!thread) {
      try {
        const res = await this.request(
          `comment_threads/find_by_comment/${commentId}`,
          'GET'
        )
        if (res.data && res.data.id) {
          thread = res.data
        }
      } catch (e) {
        trackError(e, {
          source: 'openCommentFromHighlight',
          message: `commentId: ${commentId}`,
        })
      }
    }
    if (!thread) return false

    uiStore.expandAndOpenThread(thread.key)
    await thread.API_fetchComments()
    uiStore.setReplyingToComment(commentId)
    uiStore.scrollToBottomOfComments(commentId)
  }

  async findOrBuildCommentThread(record) {
    // clear all *other* unpersisted threads
    this.clearUnpersistedThreads({ keepRecord: record })
    let thread = this.findThreadForRecord(record)
    // first search for it via API
    try {
      if (!thread) {
        // comment threads are unique by org_id so we pass that along
        const identifier = `${record.className}/${record.id}?organization_id=${this.currentUserOrganizationId}`
        const res = await this.request(
          `comment_threads/find_by_record/${identifier}`,
          'GET'
        )
        if (res.data && res.data.id) {
          thread = res.data
        }
      }
      if (thread) {
        // make sure to fetch the first page of comments
        thread.API_fetchComments()
      } else {
        // if still not found, set up a new empty record
        thread = new CommentThread(
          {
            record_id: record.id,
            record_type: record.className,
            // set this for saving...
            organization_id: this.currentUserOrganizationId,
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
    this.setCurrentPageThreadKey(thread.key)
    return thread
  }

  @computed
  get currentThreads() {
    return _.filter(
      // sort by DESC order
      _.reverse(
        _.sortBy(this.findAll('comment_threads'), t => moment(t.updated_at))
      ),
      t => {
        // don't include any new records that are being constructed
        if (!t.record || !t.record.id) return false
        // include the current page thread even if you're not following
        if (this.alwaysShowCurrentThread(t.key)) {
          return true
        }
        return this.currentCommentThreadIds.indexOf(t.id) > -1
      }
    )
  }

  alwaysShowCurrentThread(key) {
    return (
      key === this.currentPageThreadKey ||
      key === this.uiStore.expandedThreadKey
    )
  }

  get replyingToComment() {
    const { uiStore } = this
    if (!uiStore.replyingToCommentId) return null
    return this.find('comments', uiStore.replyingToCommentId)
  }

  async collapseReplies() {
    const { uiStore, replyingToComment } = this
    if (replyingToComment) {
      await replyingToComment.resetReplies()
      uiStore.setReplyingToComment(null)
    }
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

  fetchOrganizationAdmins(orgId) {
    return this.request(`organizations/${orgId}/admin_users`, 'GET')
  }

  async createSubmission(parent_id, submissionSettings) {
    const { routingStore, uiStore } = this
    const { type, template } = submissionSettings
    if (type === 'template' && template) {
      const templateData = {
        template_id: template.id,
        parent_id,
        placement: 'beginning',
      }
      uiStore.update('isLoading', true)
      const res = await this.createTemplateInstance({
        data: templateData,
        template,
        inSubmissionBox: true,
      })
      uiStore.update('isLoading', false)
      routingStore.routeTo('collections', res.data.id)
    } else {
      uiStore.openBlankContentTool({
        order: 0,
        collectionId: parent_id,
        blankType: type,
      })
    }
  }

  async createTemplateInstance({ data, template, inSubmissionBox = false }) {
    const result = await this.request(
      'collections/create_template',
      'POST',
      data
    )
    googleTagManager.push({
      event: 'templateUsed',
      formType: 'Template Used',
      templateName: template.name,
      collectionType: template.collection_type,
      submissionContent: inSubmissionBox,
    })

    this.currentUser.useTemplate(template)
    return result
  }

  async createPlaceholderCards({ data }) {
    const response = await this.request(
      `collection_cards/create_placeholders`,
      'POST',
      {
        data,
      }
    )
    const { data: placeholderCards } = response

    return placeholderCards
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
      const onlyCardIds = collection.isBoard ? cardIds : []
      const snapshot = collection.toJsonApiWithCards(onlyCardIds)
      this.undoStore.pushUndoAction({
        message: 'Delete undone',
        apiCall: () => this.unarchiveCards({ cardIds, collection, snapshot }),
        redirectPath: { type: 'collections', id: collection.id },
        redoAction: {
          message: 'Delete redone',
          apiCall: () => this.archiveCards({ cardIds, collection, undoable }),
          undoable: false,
        },
        actionType: POPUP_ACTION_TYPES.SNACKBAR,
      })
    }
    this.uiStore.deselectCards()
    this.uiStore.removeCardPositions(cardIds)
    collection.removeCardIds(cardIds)
    return archiveResult
  }

  async unarchiveCards({
    cardIds,
    collection,
    snapshot = null,
    undoable = true,
  }) {
    const onlyCardIds = collection.isBoard ? cardIds : []
    const collection_snapshot =
      snapshot || collection.toJsonApiWithCards(onlyCardIds)
    const res = await this.request('collection_cards/unarchive', 'PATCH', {
      card_ids: cardIds,
      collection_snapshot,
    })

    if (undoable) {
      this.undoStore.pushUndoAction({
        message: 'Undoing Duplicate',
        apiCall: () => {
          this.archiveCards({ cardIds, collection, undoable: false })
        },
        redirectPath: { type: 'collections', id: collection.id },
        redoAction: {
          message: 'Redoing Duplicate',
          apiCall: () => this.unarchiveCards({ cardIds, collection }),
        },
        actionType: POPUP_ACTION_TYPES.SNACKBAR,
      })
    }

    const unarchivedCollection = res.data
    // the API call returns the parent collection; refetch the unarchived cards
    unarchivedCollection.API_fetchAndMergeCards(cardIds)
  }

  async moveCards(
    data,
    { undoing = false, undoSnapshot = {}, topLeftCard = null } = {}
  ) {
    let res
    // default the undo placement to end
    let undoPlacement = 'end'
    // before the move
    if (topLeftCard) {
      undoPlacement = {
        row: topLeftCard.row,
        col: topLeftCard.col,
      }
    }
    const toCollection = this.find('collections', data.to_id)
    let fromCollection = this.find('collections', data.from_id)
    // make snapshot of fromCollection data with cards for potential undo
    const onlyCardIds = toCollection.isBoard ? data.collection_card_ids : []
    const originalData = fromCollection.toJsonApiWithCards(onlyCardIds)

    try {
      // trigger card_mover in backend
      res = await this.request('collection_cards/move', 'PATCH', data)
    } catch (e) {
      // throw to be caught by CardMoveService
      throw e
      return
    }

    runInAction(() => {
      // make sure the moved cards disappear from the fromCollection
      fromCollection.removeCardIds(data.collection_card_ids)
      // toCollection gets the new cards
      toCollection.mergeCards(res.data)
      if (undoing && !_.isEmpty(undoSnapshot)) {
        // revert data if undoing card move
        this.request(`collections/${data.to_id}`, 'PATCH', {
          data: undoSnapshot,
        })
        // apply this locally at the same time
        toCollection.revertToSnapshot(undoSnapshot.attributes)
        return
      } else if (!toCollection.isBoard) {
        toCollection.API_fetchCardOrders()
      }
    })

    if (undoing) {
      // exit early, don't push another undo if we're undoing
      return
    }

    if (!fromCollection.can_view) {
      this.undoStore.pushUndoAction({
        message:
          "Move can't be undone. You do not have access to the original collection.",
        apiCall: () => {},
        actionType: POPUP_ACTION_TYPES.ALERT,
      })
      return
    }
    // reverse to and from values for potential undo operation
    const reversedData = {
      ...data,
      placement: undoPlacement,
      to_id: data.from_id,
      from_id: data.to_id,
    }
    let undoOptions = { undoing: true, undoSnapshot: originalData }
    if (!data.from_id || data.from_id === data.to_id) {
      reversedData.to_id = data.to_id
      reversedData.from_id = null
      fromCollection = toCollection
      if (topLeftCard) {
        // don't need snapshot if we can just move back to the original placement
        undoOptions = { undoing: true, topLeftCard }
      }
    }

    // add undo operation to stack so users can undo moving cards
    this.undoStore.pushUndoAction({
      message: 'Move undone',
      apiCall: () => {
        this.moveCards(reversedData, undoOptions)
      },
      redirectPath: {
        type: 'collections',
        id: fromCollection.id,
      },
      redoRedirectPath: {
        type: 'collections',
        id: toCollection.id,
      },
      redoAction: {
        message: 'Move redone',
        apiCall: () => {
          // redo should just replicate the initial move
          this.moveCards(data, { topLeftCard })
        },
        actionType: POPUP_ACTION_TYPES.SNACKBAR,
      },
    })

    return res
  }

  linkCards(data) {
    // duplicateCards contains the same undo/redo actions we use for linking
    return this.duplicateCards(data, 'link')
  }

  async duplicateCards(data, action = 'duplicate') {
    let res
    try {
      res = await this.request(`collection_cards/${action}`, 'POST', data)
    } catch (e) {
      // throw to be caught by CardMoveService
      throw e
      return
    }
    const collection = this.find('collections', data.to_id)
    const { meta } = res
    if (meta.placeholder) {
      // TODO: how to allow you to undo a bulk duplication?
      // would probably require an API-based undo
      this.undoStore.pushUndoAction({
        message:
          "Bulk actions can't be undone. Please manually delete any records you wish to remove.",
        apiCall: () => {},
        actionType: POPUP_ACTION_TYPES.ALERT,
      })
      return res
    }
    const newCardIds = _.map(res.data, 'id')
    const actionName = _.capitalize(action)
    this.undoStore.pushUndoAction({
      message: `${actionName} undone`,
      apiCall: () =>
        this.archiveCards({
          cardIds: newCardIds,
          collection,
          undoable: false,
        }),
      redirectPath: { type: 'collections', id: collection.id },
      redoAction: {
        message: `Redoing ${actionName}`,
        apiCall: () => {
          this.unarchiveCards({
            cardIds: newCardIds,
            collection,
          })
        },
        actionType: POPUP_ACTION_TYPES.SNACKBAR,
      },
    })
    return res
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

  // default action for updating any basic apiStore value
  @action
  update(name, value) {
    this[name] = value
  }

  // having this datx wrapper allows us to avoid unit test blowups with mock data
  @action
  updateModelId(record, id) {
    // pass through to datx function
    updateModelId(record, id)
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
  CollectionFilter,
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
  QuestionChoice,
  Role,
  SurveyResponse,
  Tag,
  TestAudience,
  User,
  UsersThread,
]

export default ApiStore
