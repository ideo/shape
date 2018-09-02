// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

Cypress.Commands.add('login', ({ userId } = {}) => (
  cy.request('GET', `/login_as?id=${userId}`)
))

Cypress.Commands.add('locate', (selector) => (
  cy.get(`[data-cy=${selector}]`)
))

// NOTE: https://stackoverflow.com/a/47537751/260495
Cypress.on('window:before:load', win => {
  win.fetch = null
})
