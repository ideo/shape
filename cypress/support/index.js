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
  cy.locate('Hotspot')
    .last()
    .click()
  cy.createCollection('Cypress Test Area')
}

before(() => {
  // clean out the DB before running the suite
  cy.exec('rake cypress:db_setup')
  createNamedRoutes()
  createCypressTestArea()
})

beforeEach(() => {
  // have to start a new session every time
  cy.login({ userId: 1 })
})
