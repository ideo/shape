import _ from 'lodash'
import { action, observable } from 'mobx'
import queryString from 'query-string'
import { undoStore } from '~/stores'

// This contains some shared methods between Collection and Item

const SharedRecordMixin = superclass =>
  class extends superclass {
    @observable
    forceMenuDisabled = false

    @action
    disableMenu() {
      this.forceMenuDisabled = true
    }

    get menuDisabled() {
      return super.menuDisabled || this.forceMenuDisabled
    }

    API_updateName(name) {
      const previousName = this.name
      this.name = name
      this.pushUndo({
        snapshot: { name: previousName },
        message: `${this.className} name edit undone`,
      })
      const data = this.toJsonApi()
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
              _.pick(cardData, ['order', 'width', 'height', 'row', 'col'])
            )
          }
        })
        this._reorderCards()
        data = this.toJsonApiWithCards()
      } else {
        _.assign(this, snapshot)
        data = this.toJsonApi()
      }
      data.cancel_sync = true
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

    pushUndo({ snapshot, message = '', apiCall } = {}) {
      let undoApiCall = apiCall
      if (!apiCall) {
        undoApiCall = () => this.API_revertTo({ snapshot })
      }
      undoStore.pushUndoAction({
        message,
        apiCall: undoApiCall,
        redirectPath: { type: this.internalType, id: this.id },
      })
    }
  }

export default SharedRecordMixin
