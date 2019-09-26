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
    uiStore.update('editingCardCover', null)
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
      'ql-container',
      'public-DraftEditor-content',
      'edit-cover-title',
      'edit-cover-subtitle',
    ]).length > 0

  if (shouldNormalKeyPressBeAllowed) return false
  const { code, metaKey, ctrlKey, shiftKey } = e
  const { selectedCardIds, viewingCollection } = uiStore
  switch (code) {
    // CTRL+X: Move
    case 'KeyX':
      if (!viewingCollection) {
        return false
      }
      if (metaKey || ctrlKey) {
        if (!selectedCardIds.length) {
          return false
        }
        const card = apiStore.find('collection_cards', selectedCardIds[0])
        if (card) {
          card.reselectOnlyEditableCards(selectedCardIds)
        }
        viewingCollection.confirmEdit({
          onConfirm: () => {
            uiStore.openMoveMenu({
              from: viewingCollection,
              cardAction: 'move',
            })
          },
        })
      }
      break
    // CTRL+C: Duplicate
    case 'KeyC':
      if (!viewingCollection) {
        return false
      }
      if (metaKey || ctrlKey) {
        uiStore.openMoveMenu({
          from: viewingCollection,
          cardAction: 'duplicate',
        })
      }
      break
    // CTRL+V: Place (Paste)
    case 'KeyV':
      if (metaKey || ctrlKey) {
        // MoveModal will listen to this value and then set it to false
        uiStore.update('pastingCards', true)
      }
      break
    case 'KeyZ':
      // CTRL+Shift+Z: Redo
      if (shiftKey && (metaKey || ctrlKey)) {
        undoStore.handleRedoKeyPress()
        break
      }
      // CTRL+Z: Undo
      if (metaKey || ctrlKey) {
        undoStore.handleUndoKeypress()
      }
      break
    case 'KeyA':
      if (uiStore.viewingCollection && (metaKey || ctrlKey)) {
        e.preventDefault()
        uiStore.selectAll({ location: 'Global' }) // CTRL+A: Select All
      }
      break
    case 'Backspace':
    case 'Delete':
      if (!selectedCardIds || !selectedCardIds.length) {
        return false
      }
      const card = apiStore.find('collection_cards', selectedCardIds[0])
      // see note in CollectionCard model -- this could really be a static method;
      // because it's not, we just have to call it on any selected card
      card.API_archive()
      break
    case 'Escape':
      // save on sec happens only when user clicks the title textarea
      const { editingCardCover } = uiStore
      if (editingCardCover) {
        uiStore.update('editingCardCover', null)
      }
      break
    default:
      break
  }
  return false
}

export default captureGlobalKeypress
