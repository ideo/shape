import _ from 'lodash'
import { apiStore, uiStore, undoStore } from '~/stores'

const captureGlobalKeypress = e => {
  const { activeElement } = document
  // if we're typing into an input element, we want to allow normal keypresses
  if (activeElement.nodeName === 'INPUT') return false
  // likewise for quill / draftjs content
  if (
    _.intersection(activeElement.classList, [
      'ql-editor',
      'public-DraftEditor-content',
    ]).length > 0
  ) {
    return false
  }

  if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey)) {
    // CTRL+Z: Undo
    undoStore.handleUndoKeypress()
  } else if (e.code === 'Backspace' || e.code === 'Delete') {
    // BACKSPACE: Archive cards
    const { selectedCardIds } = uiStore
    if (!selectedCardIds.length) return false
    const card = apiStore.find('collection_cards', selectedCardIds[0])
    // see note in CollectionCard model -- this could really be a static method;
    // because it's not, we just have to call it on any selected card
    card.API_archive()
  }
  return false
}

export default captureGlobalKeypress
