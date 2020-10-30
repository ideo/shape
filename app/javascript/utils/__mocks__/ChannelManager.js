const fakeChannel = { perform: jest.fn() }
export default {
  channels: {},
  subscribe: jest.fn().mockReturnValue(fakeChannel),
  unsubscribe: jest.fn(),
  unsubscribeAllFromChannel: jest.fn(),
  channelId: jest.fn(),
  getChannel: jest.fn().mockReturnValue(fakeChannel),
}
