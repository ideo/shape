import ActionCable from 'actioncable'

// get actionCableUrl from metatags in head
const actionCableUrl = document.head.querySelector(
  '[name~=action-cable-url][content]'
).content
const consumer = ActionCable.createConsumer(actionCableUrl)

export default consumer
