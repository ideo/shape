import ActionCableConsumer from './ActionCableConsumer'

class ChannelManager {
  channels = {}

  subscribe(channelName, recordId, callbacks = {}) {
    const channelId = this.channelId(channelName, recordId)
    if (this.channels[channelId]) return this.channels[channelId]
    const channel = ActionCableConsumer.subscriptions.create(
      {
        channel: channelName,
        id: recordId,
      },
      {
        connected: callbacks.channelConnected || function() {},
        disconnected: callbacks.channelDisconnected || function() {},
        received: callbacks.channelReceivedData || function() {},
        rejected: callbacks.channelRejected || function() {},
      }
    )
    this.channels[channelId] = channel
    return channel
  }

  channelId = (channel, recordId = 'home') => `${channel}_${recordId}`

  getChannel(channel, recordId) {
    return this.channels[this.channelId(channel, recordId)]
  }

  unsubscribeAllFromChannel(channelName, { keepOpen = false } = {}) {
    Object.keys(this.channels).forEach(channelId => {
      if (channelId.split('_')[0] === channelName) {
        const channel = this.channels[channelId]
        if (!keepOpen) {
          channel.unsubscribe()
        }
        delete this.channels[channelId]
      }
    })
  }
}

export default new ChannelManager()
