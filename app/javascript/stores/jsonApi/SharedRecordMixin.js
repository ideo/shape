import _ from 'lodash'
import { action, computed, runInAction, observable } from 'mobx'
import queryString from 'query-string'

import TitleAndCoverEditingMixin from './TitleAndCoverEditingMixin'
import v from '~/utils/variables'

// This contains some shared methods between Collection and Item
const SharedRecordMixin = superclass =>
  class extends TitleAndCoverEditingMixin(superclass) {
    @observable
    forceMenuDisabled = false
    @observable
    fullyLoaded = null
    @observable
    collaborators = []
    highlightedRange = null
    @observable
    tags = []
    // have to default `tagged_users` to an empty array so it can always be pushed to
    @observable
    tagged_users = []
    @observable
    parentChallenge = null
    @observable
    reviewerStatuses = []

    @action
    disableMenu() {
      this.forceMenuDisabled = true
    }

    @action
    updateFullyLoaded(val) {
      this.fullyLoaded = val
    }

    get menuDisabled() {
      return this.isSharedCollection || this.forceMenuDisabled || !this.can_view
    }

    get frontendPath() {
      return `/${this.internalType}/${this.id}`
    }

    get frontendUrl() {
      return (
        _.get(window, 'CONFIG.BASE_HOST', 'https://www.shape.space') +
        this.frontendPath
      )
    }

    get isCommonViewable() {
      return this.common_viewable
    }

    get pageTitle() {
      return `${this.name} | Shape`
    }

    get isRestorable() {
      return this.archived && this.is_restorable && this.can_edit
    }

    get parentPath() {
      if (this.breadcrumb && this.breadcrumb.length > 1) {
        const { type, id } = this.breadcrumb[this.breadcrumb.length - 2]
        return this.routingStore.pathTo(type, id)
      }
      return this.routingStore.pathTo('homepage')
    }

    async API_revertTo({ snapshot } = {}) {
      let data, currentSnapshot
      // special case if you're undoing a card resize/move
      if (snapshot.collection_cards_attributes) {
        const cardIds = _.map(snapshot.collection_cards_attributes, 'id')
        currentSnapshot = this.toJsonApiWithCards(cardIds).attributes
        this.revertToSnapshot(snapshot)
        data = this.toJsonApiWithCards(cardIds)
      } else {
        _.assign(this, snapshot)
        data = this.toJsonApi()
      }

      try {
        const res = await this.apiStore.request(this.baseApiPath, 'PATCH', {
          data,
        })
        // much like API_batchUpdateCardsWithUndo, we have to reapply the local state
        this.revertToSnapshot(snapshot)
        return res
      } catch {
        if (snapshot && this.internalType === 'collections') {
          this.uiStore.popupSnackbar({
            message: 'Undo cancelled due to overlap',
          })
          // revert it to its original state because the undo didn't work
          this.revertToSnapshot(currentSnapshot)
        }
      }
    }

    API_restorePermissions() {
      const apiPath = `${this.baseApiPath}/restore_permissions`
      return this.apiStore.request(apiPath, 'PATCH')
    }

    API_willBecomePrivate({ removing, roleName }) {
      const apiPath = `${this.baseApiPath}/roles/will_become_private`
      const remove_identifiers = [`${removing.className}_${removing.id}`]
      const params = {
        role_name: roleName,
        remove_identifiers,
      }
      return this.apiStore.requestJson(
        `${apiPath}?${queryString.stringify(params)}`
      )
    }

    API_addRemoveTag = (action, data) => {
      const { apiStore } = this
      const { label, type } = data
      return apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
        card_ids: [this.parent_collection_card.id],
        tag: label,
        type,
      })
    }

    @action
    addTag(label, type, user) {
      this[type].push(label)
      if (type === 'user_tag_list' && user) {
        this.tagged_users.push(user)
        // assume / push the 'unstarted' status for the user
        this.reviewerStatuses.push({
          record_id: this.id,
          status: 'unstarted',
          user_id: user.id,
        })
      }
      return this.API_addRemoveTag('add', { label, type })
    }

    @action
    removeTag(label, type, user) {
      _.remove(this[type], tag => {
        return tag === label
      })
      if (type === 'user_tag_list') {
        const { tagged_users } = this
        if (tagged_users) {
          _.remove(this.tagged_users, u => {
            return u.handle === label
          })
        }
      }
      return this.API_addRemoveTag('remove', { label, type })
    }

    async initializeParentChallengeForCollection() {
      let challenge = null
      if (this.isCollection && this.collection_type === 'challenge') {
        challenge = this
      } else {
        const challengeForCollection = await this.fetchChallengeForCollection()
        if (challengeForCollection.data) {
          challenge = challengeForCollection.data
        }
      }
      if (challenge) {
        runInAction(() => {
          this.parentChallenge = challenge
          if (this.isSubmissionBox && this.submissions_collection) {
            this.submissions_collection.parentChallenge = challenge
          }
        })
      }
    }

    // NOTE: use this method instead of the challenge attribute to ensure that the right associations are included, ie: roles
    async fetchChallengeForCollection() {
      // return cached parent collection
      if (this.parentChallenge) return this.parentChallenge
      // Otherwise we need to load the challenge collection
      return await this.apiStore.request(
        `collections/${this.parent_challenge_id}`
      )
    }

    get isCurrentUserAPotentialReviewer() {
      const { currentUserId } = this.apiStore
      return this.potentialReviewers.findIndex(r => r.id === currentUserId) > -1
    }

    async restore() {
      const { routingStore, uiStore } = this
      uiStore.update('isLoading', true)
      await this.apiStore.unarchiveCards({
        cardIds: [this.parent_collection_card.id],
        collection: this,
        undoable: false,
      })
      if (this.parent) {
        routingStore.routeTo('collections', this.parent.id)
      } else if (this.parentPath) {
        routingStore.goToPath(this.parentPath)
      }
      uiStore.update('isLoading', false)
    }

    @action
    setCollaborators(collaborators) {
      const { collaboratorColors } = this.uiStore
      const { currentUserId } = this.apiStore
      const otherCollaborators = _.reject(
        collaborators,
        c => c.id === currentUserId
      )
      const sorted =
        // sort by most recent first
        _.reverse(
          _.sortBy(otherCollaborators, e => {
            return new Date(e.timestamp)
          })
        )

      _.each(sorted, collaborator => {
        if (!collaboratorColors.has(collaborator.id)) {
          // size starts at 0 before any are added, this should get the first color
          const nextColor =
            v.collaboratorColorNames[collaboratorColors.size % 10]
          collaboratorColors.set(collaborator.id, nextColor)
        }
        collaborator.color = collaboratorColors.get(collaborator.id)
      })
      this.collaborators.replace(sorted)
    }

    // this is used to highlight someone making an edit on a card
    setLatestCollaborator(collaborator) {
      // because this is just setting collaborators on a card.record within the current collection
      // we just set the 1 collaborator and then remove them after timeout
      this.setCollaborators([collaborator])
      if (this.latestCollaboratorTimeout) {
        clearTimeout(this.latestCollaboratorTimeout)
      }
      this.latestCollaboratorTimeout = setTimeout(() => {
        this.setCollaborators([])
      }, 5000)
    }

    setCollaboratorCursorPosition({ collaboratorId, coordinates } = {}) {
      const collaborator = _.find(this.collaborators, { id: collaboratorId })
      if (!collaborator) return
      collaborator.coordinates = coordinates
      // set our array with the new coordinates tacked on to the collaborator
      this.setCollaborators(this.collaborators)
    }

    @computed
    get taggedUsersWithStatuses() {
      if (_.isEmpty(this.tagged_users)) return []
      if (_.isEmpty(this.reviewerStatuses)) return []
      const taggedUsers = this.tagged_users.map(taggedUser => {
        const statusForUser = this.reviewerStatuses.find(
          status => parseInt(status.user_id) === parseInt(taggedUser.id)
        )
        if (statusForUser) {
          return {
            ...taggedUser.rawAttributes(),
            status: statusForUser.status,
            color: v.statusColor[statusForUser.status],
          }
        }
      })
      return _.compact(taggedUsers)
    }

    initializeTags = () => {
      const { tagged_users } = this
      const userTagsWithUsers = _.map(tagged_users, user => {
        if (user) {
          return {
            label: user.handle,
            type: 'user_tag_list',
            user: user.toJSON(),
          }
        }
      })
      const tagList = []
      const tagListKeys = _.get(this, 'isChallengeOrInsideChallenge')
        ? ['tag_list', 'topic_list']
        : ['tag_list']
      _.each(tagListKeys, tagType => {
        _.each(this[tagType], tag => {
          tagList.push({
            label: tag,
            type: tagType,
          })
        })
      })

      runInAction(() => {
        this.tags = [...userTagsWithUsers, ...tagList]
      })
    }
  }

export default SharedRecordMixin
