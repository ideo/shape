export default {
  getUserInfo: jest.fn().mockReturnValue(Promise.resolve()),
  signIn: jest.fn().mockReturnValue(Promise.resolve()),
  signUp: jest.fn().mockReturnValue(Promise.resolve()),
  logout: jest.fn().mockReturnValue(Promise.resolve()),
}
