import _ from 'lodash'
import { apiStore, uiStore, undoStore } from '~/stores'
import { quillSelectors } from '~/utils/variables'

const quillEditorClick = e => {
  return e.target.closest(quillSelectors)
}

const emptySpaceClick = e => {
  const { target } = e
  return !!(
    target.getAttribute && target.getAttribute('data-empty-space-click')
  )
}

export const handleMouseDownSelection = e => {
  const emptySpaceMouseDown = emptySpaceClick(e)
  const { isEditingText } = uiStore
  const outsideQuillMouseDown = !quillEditorClick(e) && isEditingText
  if (emptySpaceMouseDown) {
    if (outsideQuillMouseDown) {
      uiStore.setCommentingOnRecord(null)
      // we need a tiny delay so that the highlight gets properly unset
      // before kicking out of the textEditingItem
      setTimeout(() => {
        uiStore.update('textEditingItem', null)
      })
    }
    // if we clicked an empty space...
    uiStore.deselectCards()
    uiStore.onEmptySpaceClick(e)
    uiStore.closeBlankContentTool()
    uiStore.closeCardMenu()
    uiStore.update('editingCardCover', null)
    return 'emptySpace'
  }
  return false
}

const captureGlobalKeypress = e => {
  const { activeElement } = document

  // none of the following card editing actions apply when you are editing a test
  if (_.get(uiStore, 'viewingCollection.isTestCollection')) {
    return false
  }
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
  const ctrlKeypress = metaKey || ctrlKey
  let card
  switch (code) {
    // CTRL+X: Move
    case 'KeyX':
      if (!viewingCollection || !ctrlKeypress) {
        return false
      }
      if (!selectedCardIds.length) {
        return false
      }
      card = apiStore.find('collection_cards', selectedCardIds[0])
      if (card) {
        // TODO: investigate... shouldn't need to reselect on move, but
        // what if you select pinned cards? API will reject the move... ?
        card.reselectOnlyMovableCards(selectedCardIds)
      }
      viewingCollection.confirmEdit({
        onConfirm: () => {
          uiStore.openMoveMenu({
            from: viewingCollection,
            cardAction: 'move',
          })
        },
      })
      break
    // CTRL+C: Duplicate
    case 'KeyC':
      if (!viewingCollection || !ctrlKeypress) {
        return false
      }
      uiStore.openMoveMenu({
        from: viewingCollection,
        cardAction: 'duplicate',
      })
      break
    // CTRL+V: Place (Paste)
    case 'KeyV':
      if (ctrlKeypress) {
        // MoveModal will listen to this value and then set it to false
        uiStore.update('pastingCards', true)
      }
      break
    case 'KeyZ':
      if (!ctrlKeypress) {
        return false
      }
      // CTRL+Shift+Z: Redo
      if (shiftKey) {
        undoStore.handleRedoKeyPress()
        break
      }
      // CTRL+Z: Undo
      undoStore.handleUndoKeypress()
      break
    // CTRL+A: Select All
    case 'KeyA':
      if (ctrlKeypress && uiStore.viewingCollection) {
        e.preventDefault()
        uiStore.selectAll({ location: 'Global' })
      }
      break
    case 'Backspace':
    case 'Delete':
      if (!selectedCardIds || !selectedCardIds.length) {
        return false
      }
      card = apiStore.find('collection_cards', selectedCardIds[0])
      // see note in CollectionCard model -- this could really be a static method;
      // because it's not, we just have to call it on any selected card
      card.API_archive()
      break
    case 'Escape':
      // save on esc happens only when user clicks the title textarea
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
