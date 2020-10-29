export default {
  channels: {},
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAllFromChannel: jest.fn(),
  channelId: jest.fn(),
  getChannel: jest.fn().mockReturnValue({ perform: jest.fn() }),
}
