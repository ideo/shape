const fakeActionCableConsumer = () => {
  return {
    subscriptions: {
      create: (channelConfig, callbackFns) => {
        {
          perform: jest.fn()
        }
      }
    }
  }
}

export default fakeActionCableConsumer
