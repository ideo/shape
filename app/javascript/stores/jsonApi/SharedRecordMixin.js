import _ from 'lodash'
import { undoStore } from '~/stores'

// This contains some shared methods between Collection and Item

const SharedRecordMixin = superclass =>
  class extends superclass {
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
      const apiPath = `${this.internalType}/${this.id}`
      return this.apiStore.request(apiPath, 'PATCH', { data })
    }

    API_revertTo({ snapshot, jsonData } = {}) {
      let data = jsonData
      if (snapshot) {
        _.assign(this, snapshot)
        data = this.toJsonApi()
        data.cancel_sync = true
      }
      const apiPath = `${this.internalType}/${this.id}`
      return this.apiStore.request(apiPath, 'PATCH', { data })
    }

    pushUndo({ snapshot, jsonData, message = '' } = {}) {
      undoStore.pushUndoAction({
        message,
        apiCall: () => this.API_revertTo({ snapshot, jsonData }),
        redirectPath: { type: this.internalType, id: this.id },
      })
    }
  }

export default SharedRecordMixin
