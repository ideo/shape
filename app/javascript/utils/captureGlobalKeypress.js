import _ from 'lodash'
import { apiStore, uiStore, undoStore } from '~/stores'

const captureGlobalKeypress = e => {
  const { activeElement } = document

  // allow normal keypress on input element, quill, and draftjs
  const shouldNormalKeyPressBeAllowed =
    activeElement.nodeName === 'INPUT' ||
    _.intersection(activeElement.classList, [
      'ql-editor',
      'public-DraftEditor-content',
    ]).length > 0

  if (shouldNormalKeyPressBeAllowed) return false

  switch (e.code) {
    case 'KeyX':
      if (e.metaKey || e.ctrlKey) {
        if (!uiStore.viewingCollection) return
        uiStore.openMoveMenu({
          from: uiStore.viewingCollection.id, // CTRL+X: Move
          cardAction: 'move',
        })
      }
      break
    case 'KeyC':
      if (e.metaKey || e.ctrlKey) {
        if (!uiStore.viewingCollection) return
        uiStore.openMoveMenu({
          from: uiStore.viewingCollection.id, // CTRL+C: Duplicate
          cardAction: 'duplicate',
        })
      }
      break
    case 'KeyV':
      if (e.metaKey || e.ctrlKey) {
        // CTRL+V: Place
        // MoveModal will listen to this value and then set it to false
        uiStore.update('pastingCards', true)
      }
      break
    case 'KeyZ':
      if (e.metaKey || e.ctrlKey) {
        undoStore.handleUndoKeypress() // CTRL+Z: Undo
      }
      break
    case 'Backspace':
    case 'Delete':
      const { selectedCardIds } = uiStore
      if (!selectedCardIds.length) {
        return false
      }
      const card = apiStore.find('collection_cards', selectedCardIds[0])
      // see note in CollectionCard model -- this could really be a static method;
      // because it's not, we just have to call it on any selected card
      card.API_archive()
      break
    default:
      break
  }
  return false
}

export default captureGlobalKeypress
