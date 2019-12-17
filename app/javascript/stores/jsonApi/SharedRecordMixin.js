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
              this.API_updateName(name),
          },
        })
      }
      const data = this.toJsonApi()
      // see collection_updater.rb for deserialization
      if (this.internalType === 'collections') {
        if (hardcodedSubtitle !== this.subtitle) {
          data.attributes.hardcoded_subtitle = hardcodedSubtitle
          this.cover.hardcoded_subtitle = hardcodedSubtitle
        }
        this.cover.subtitle_hidden = subtitleHidden
        data.attributes.subtitle_hidden = subtitleHidden
      } else if (this.isLink) {
        if (hardcodedSubtitle !== this.content) {
          data.attributes.content = hardcodedSubtitle
          this.content = hardcodedSubtitle
        }
      }

      // cancel sync so that name edits don't roundtrip and interfere with your <input>
      data.cancel_sync = true
      return this.apiStore.request(this.baseApiPath, 'PATCH', { data })
    }

    API_revertTo({ snapshot } = {}) {
      let data
      // special case if you're undoing a card resize/move
      if (snapshot.collection_cards_attributes) {
        snapshot.collection_cards_attributes.forEach(cardData => {
          const card = this.collection_cards.find(cc => cc.id === cardData.id)
          if (card) {
            _.assign(
              card,
              _.pick(cardData, ['order', 'width', 'height', 'row', 'col']),
              {
                updated_at: new Date(),
              }
            )
          }
        })
        this._reorderCards()
        data = this.toJsonApiWithCards()
      } else {
        _.assign(this, snapshot)
        data = this.toJsonApi()
      }

      return this.apiStore.request(this.baseApiPath, 'PATCH', { data })
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
      this.undoStore.pushUndoAction({
        message,
        apiCall: undoApiCall,
        redirectPath: { type: redirectTo.internalType, id: redirectTo.id },
        redoAction,
        actionType,
      })
    }
  }

export default SharedRecordMixin
