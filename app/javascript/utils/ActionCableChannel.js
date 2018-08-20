
import ActionCableConsumer from '~/utils/ActionCableConsumer'

class ActionCableChannel {
  this.channels = {}

  subscribe(channel, recordId, callbacks) {
    const channel = ActionCableConsumer.subscriptions.create(
      {
        channel: channel,
        id: recordId,
      },
      {
        connected: callbacks.channelConnected || () => {},
        disconnected: callbacks.channelDisconnected || () => {},
        received: callbacks.channelReceivedData || () => {},
        rejected: callbacks.channelRejected || () => {},
      }
    )
    this.channels[this.channelId(channel, recordId)] = channel
    return channel
  }

  channelId(channel, recordId) {
    return `${channel}_${recordId}`
  }

  getChannel(channel, recordId) {
    return this.channels.find(channelId(channel, recordId))
  }
}

export default new ActionCableChannel()
