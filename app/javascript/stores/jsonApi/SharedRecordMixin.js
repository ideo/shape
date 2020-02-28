import _ from 'lodash'
import { action, observable } from 'mobx'
import queryString from 'query-string'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'

// This contains some shared methods between Collection and Item
const SharedRecordMixin = superclass =>
  class extends superclass {
    @observable
    forceMenuDisabled = false
    @observable
    fullyLoaded = null
    highlightedRange = null

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

    @action
    API_updateNameAndCover({
      name,
      hardcodedSubtitle = '',
      subtitleHidden = false,
    }) {
      const previousName = this.name
      this.name = name
      if (name !== previousName) {
        this.pushUndo({
          snapshot: { name: previousName },
          message: `${this.className} name edit undone`,
          actionType: POPUP_ACTION_TYPES.SNACKBAR,
          redirectTo: { internalType: null, id: null }, // we don't need to redirect when undoing a cover title edit
          redoAction: {
            message: `${this.className} name edit redone`,
            apiCall: () =>
              // re-call the same function
              this.API_updateNameAndCover(name),
          },
        })
      }
      const data = this.toJsonApi()
      // see collection_updater.rb for deserialization
      if (this.internalType === 'collections') {
        if (hardcodedSubtitle !== this.subtitle) {
          this.cover.hardcoded_subtitle = hardcodedSubtitle
        }
        data.attributes.hardcoded_subtitle = hardcodedSubtitle
        this.cover.subtitle_hidden = subtitleHidden
        data.attributes.subtitle_hidden = subtitleHidden
      } else if (this.isLink) {
        if (hardcodedSubtitle !== this.content) {
          this.content = hardcodedSubtitle
        }
        data.attributes.content = hardcodedSubtitle
        data.attributes.subtitle_hidden = subtitleHidden
        this.subtitle_hidden = subtitleHidden
      }

      // cancel sync so that name edits don't roundtrip and interfere with your <input>
      data.cancel_sync = true
      return this.patch(data)
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

    async API_willBecomePrivate({ removing, roleName }) {
      const apiPath = `${this.baseApiPath}/roles/will_become_private`
      const remove_identifiers = [`${removing.className}_${removing.id}`]
      const params = {
        role_name: roleName,
        remove_identifiers,
      }
      const res = await this.apiStore.request(
        `${apiPath}?${queryString.stringify(params)}`,
        'GET'
      )
      return res.__response.data
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

    pushUndo({
      snapshot,
      message = '',
      apiCall,
      redirectTo = this,
      redoAction = null,
      actionType = POPUP_ACTION_TYPES.SNACKBAR,
    } = {}) {
      let undoApiCall = apiCall
      if (!apiCall) {
        undoApiCall = () => this.API_revertTo({ snapshot })
      }
      let redirectPath = null
      if (redirectTo) {
        redirectPath = { type: redirectTo.internalType, id: redirectTo.id }
      }
      this.undoStore.pushUndoAction({
        message,
        apiCall: undoApiCall,
        redirectPath,
        redoAction,
        actionType,
      })
    }
  }

export default SharedRecordMixin
