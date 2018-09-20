// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

const createNamedRoutes = () => {
  cy.server()
  cy.route('POST', '/api/v1/collection_cards').as('apiCreateCollectionCard')
  cy.route('GET', '/api/v1/collections/*').as('apiGetCollection')
}

const createCypressTestArea = () => {
  // login, open BCT and create our test collection
  cy.login({ userId: 1 })
  cy.visit('/')
  cy.createCollection({ name: 'Cypress Test Area' })

  // create single inner collection
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
  cy.wait('@apiGetCollection')
  cy.createCollection({ name: 'Inner collection', empty: true })
}

before(() => {
  // clean out the DB before running the suite
  cy.exec('spring rake cypress:db_setup')
  createNamedRoutes()
  createCypressTestArea()
})

beforeEach(() => {
  // have to start a new session every time
  cy.login({ userId: 1 })
})
