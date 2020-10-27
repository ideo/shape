import { action } from 'mobx'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'
import { COLLECTION_CARD_TYPES } from '~/utils/variables'

// This contains some shared methods between Records and CollectionCards
const TitleAndCoverEditingMixin = superclass =>
  class extends superclass {
    @action
    API_updateNameAndCover({
      name,
      hardcodedTitle = '',
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
      if (this.isLinkCard || this.isCollection) {
        if (hardcodedTitle !== this.cover.hardcoded_title) {
          this.cover.hardcoded_title = hardcodedTitle
        }
        if (hardcodedSubtitle !== this.subtitle) {
          this.cover.hardcoded_subtitle = hardcodedSubtitle
        }
        data.attributes.hardcoded_title = hardcodedTitle
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

    @action
    API_clearCover() {
      let path = ''
      if (
        this.internalType === 'collection_cards' &&
        this.type === COLLECTION_CARD_TYPES.LINK
      ) {
        path = `collection_cards/${this.id}/clear_collection_card_cover`
      } else if (this.internalType === 'collections') {
        path = `collections/${this.id}/clear_collection_cover`
      }
      if (!path) return

      return this.apiStore.request(path, 'POST').catch(err => {
        console.warn(err)
        this.uiStore.alert(
          'Unable to change the collection cover. This may be a special collection that you cannot edit.'
        )
      })
    }
  }

export default TitleAndCoverEditingMixin
