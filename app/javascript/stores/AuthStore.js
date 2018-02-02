import { types } from 'mobx-state-tree'

// define User model
const User = types
  .model('User', {
    id: types.identifier(types.number),
    email: types.string,
    firstName: types.string,
    lastName: types.string,
  })
  .views(self => ({
    fullName() {
      return `${this.firstName} ${this.lastName}`
    }
  }))
  .actions(self => ({
    changeFirstName(firstName) {
      self.firstName = firstName
    }
  }))

// define model for storing User model
const AuthStore = types
  .model('AuthStore', {
    currentUser: types.maybe(User)
  })
  .actions(self => ({
    loadUser(userData) {
      self.currentUser = userData
    }
  }))

export default AuthStore
