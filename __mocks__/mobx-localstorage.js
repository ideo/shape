
const localStorage = jest.genMockFromModule('mobx-localstorage')
const store = {}

localStorage.__setValue = (key, val) => {
  store[key] = val
}
localStorage.__clear = () => {
  store = {}
}

localStorage.__store = () => store

export default localStorage
