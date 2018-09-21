// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

Cypress.Commands.add('login', ({ userId } = {}) =>
  cy.request('GET', `/login_as?id=${userId}`)
)

Cypress.Commands.add('logout', () => cy.request('DELETE', '/api/v1/sessions'))

Cypress.Commands.add('locate', selector => cy.get(`[data-cy="${selector}"]`))
Cypress.Commands.add('locateWith', (selector, text) =>
  cy.contains(`[data-cy="${selector}"]`, text)
)

Cypress.Commands.add(
  'createCollection',
  ({ name, collectionType = 'normal', empty = false }) => {
    let type = 'collection'
    // these types correspond to the BctButtonBox types in GridCardBlank
    switch (collectionType) {
      case 'test':
        type = 'testCollection'
        break
      default:
        // e.g. "normal"
        type = 'collection'
        break
    }
    if (!empty) {
      cy.locate('Hotspot')
        .last()
        .click()
    }
    cy.locate(`BctButton-${type}`)
      .first()
      .click()
    // force == don't care if it's "covered by tooltip"
    cy.locate('CollectionCreatorTextField').type(name, {
      force: true,
    })
    cy.locate('CollectionCreatorFormButton').click()
    cy.wait('@apiCreateCollectionCard')
  }
)

// NOTE: https://stackoverflow.com/a/47537751/260495
// this hack is what allows cypress + fetch to work together, otherwise it doesn't
// work to use cy.wait(@route)
Cypress.on('window:before:load', win => {
  win.fetch = null
})
