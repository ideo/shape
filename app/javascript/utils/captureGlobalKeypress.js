import _ from 'lodash'
import { apiStore, uiStore, undoStore } from '~/stores'

const quillEditorClick = e => {
  const quillSelectors =
    '.quill, .ql-close, .ql-toolbar, .ql-container, .ql-editor, .ql-clipboard, .quill-toolbar, .ql-formats, .ql-header, .ql-link, .ql-stroke'
  return e.target.closest(quillSelectors)
}

const emptySpaceClick = e => {
  const { target } = e
  return !!(
    target.getAttribute && target.getAttribute('data-empty-space-click')
  )
}

export const handleMouseDownSelection = e => {
  const { textEditingItem } = uiStore
  const emptySpaceMouseDown = emptySpaceClick(e)
  const outsideQuillMouseDown = !quillEditorClick(e) && textEditingItem
  if (outsideQuillMouseDown) {
    // if we clicked outside the quill editor...
    uiStore.update('textEditingItem', null)
  }
  if (emptySpaceMouseDown) {
    // if we clicked an empty space...
    uiStore.deselectCards()
    uiStore.onEmptySpaceClick(e)
    uiStore.closeBlankContentTool()
    return 'emptySpace'
  }
  return false
}

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
  const { code, metaKey, ctrlKey, shiftKey } = e
  const { viewingCollection } = uiStore
  switch (code) {
    case 'KeyX':
      if (!viewingCollection) {
        return false
      }
      if (metaKey || ctrlKey) {
        const { id: viewingCollectionId } = viewingCollection
        uiStore.openMoveMenu({
          from: viewingCollectionId, // CTRL+X: Move
          cardAction: 'move',
        })
      }
      break
    case 'KeyC':
      if (!viewingCollection) {
        return false
      }
      if (metaKey || ctrlKey) {
        const { id: viewingCollectionId } = viewingCollection
        uiStore.openMoveMenu({
          from: viewingCollectionId, // CTRL+C: Duplicate
          cardAction: 'duplicate',
        })
      }
      break
    case 'KeyV':
      if (metaKey || ctrlKey) {
        // CTRL+V: Place
        // MoveModal will listen to this value and then set it to false
        uiStore.update('pastingCards', true)
      }
      break
    case 'KeyZ':
      if (shiftKey && (metaKey || ctrlKey)) {
        undoStore.handleRedoKeyPress() // CTRL+Shift+Z: Redo
        break
      }
      if (metaKey || ctrlKey) {
        undoStore.handleUndoKeypress() // CTRL+Z: Undo
      }
      break
    case 'Backspace':
    case 'Delete':
      const { selectedCardIds } = uiStore
      if (!selectedCardIds || !selectedCardIds.length) {
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
