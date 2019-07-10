import ActionCable from 'actioncable'

// get actionCableUrl from metatags in head
const metatag = document.head.querySelector('[name~=action-cable-url][content]')
const actionCableUrl = metatag ? metatag.content : process.env.ACTION_CABLE_URL
const consumer = ActionCable.createConsumer(actionCableUrl)

export default consumer
