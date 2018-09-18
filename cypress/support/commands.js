// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

Cypress.Commands.add('login', ({ userId } = {}) =>
  cy.request('GET', `/login_as?id=${userId}`)
)

Cypress.Commands.add('logout', () => cy.request('DELETE', '/api/v1/sessions'))

Cypress.Commands.add('locate', selector => cy.get(`[data-cy=${selector}]`))

Cypress.Commands.add('createCollection', collectionName => {
  cy.locate('BctButton-collection')
    .first()
    .click()
  // force == don't care if it's "covered by tooltip"
  cy.locate('CollectionCreatorTextField').type(collectionName, { force: true })
  cy.locate('CollectionCreatorFormButton').click()
})

// NOTE: https://stackoverflow.com/a/47537751/260495
Cypress.on('window:before:load', win => {
  win.fetch = null
})
