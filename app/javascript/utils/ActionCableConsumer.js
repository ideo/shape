import ActionCable from 'actioncable'

const { ACTION_CABLE_URL } = process.env

const consumer = ActionCable.createConsumer(ACTION_CABLE_URL)

export default consumer
