import ActionCableConsumer from '~/utils/ActionCableConsumer'

class ChannelManager {
  channels = {}

  subscribe(channelName, recordId, callbacks = {}) {
    const channelId = this.channelId(channelName, recordId)
    const callbackConfig = {
      connected: callbacks.channelConnected || function() {},
      disconnected: callbacks.channelDisconnected || function() {},
      received: callbacks.channelReceivedData || function() {},
      rejected: callbacks.channelRejected || function() {},
    }
    let channel = this.channels[channelId]
    if (channel) {
      // make sure callbacks are configured correctly for this existing channel
      Object.assign(channel, callbackConfig)
      return channel
    }
    channel = ActionCableConsumer.subscriptions.create(
      {
        channel: channelName,
        id: recordId,
      },
      callbackConfig
    )
    this.channels[channelId] = channel
    return channel
  }

  unsubscribe(channelName, recordId) {
    const channelId = this.channelId(channelName, recordId)
    const channel = this.channels[channelId]
    if (!channel) return
    channel.unsubscribe()
    delete this.channels[channelId]
  }

  channelId = (channel, recordId = 'home') => `${channel}_${recordId}`

  getChannel(channel, recordId) {
    return this.channels[this.channelId(channel, recordId)]
  }

  unsubscribeAllFromChannel(channelName) {
    Object.keys(this.channels).forEach(channelId => {
      if (channelId.split('_')[0] === channelName) {
        const channel = this.channels[channelId]
        channel.unsubscribe()
        delete this.channels[channelId]
      }
    })
  }
}

export default new ChannelManager()
