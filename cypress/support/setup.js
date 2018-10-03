// ***********************************************************
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

const createNamedRoutes = () => {
  cy.server()
  // internal API routes
  cy.route('GET', '/api/v1/users/me').as('apiGetCurrentUser')
  cy.route('POST', '/api/v1/collection_cards').as('apiCreateCollectionCard')
  cy.route('PATCH', '/api/v1/collection_cards/*/replace').as(
    'apiReplaceCollectionCard'
  )
  cy.route('GET', '/api/v1/collections/*').as('apiGetCollection')
  cy.route('GET', '/api/v1/collections/*/in_my_collection').as(
    'apiGetInMyCollection'
  )
  cy.route('PATCH', '/api/v1/collections/*').as('apiUpdateCollection')
  cy.route('PATCH', '/api/v1/collections/*/launch_test').as('apiLaunchTest')
  // external routes
  cy.route('GET', '**/youtube/v3/videos*', 'fx:youtube-api').as('youtubeApi')
}

const createCypressTestArea = () => {
  // login, open BCT and create our test collection
  cy.login({ userId: 1 })
  cy.visit('/')
  cy.createCollection({ name: 'Cypress Test Area' })

  // create single inner collection
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click({ force: true })
  cy.wait('@apiGetCollection')
  cy.createCollection({ name: 'Inner collection', empty: true })
}

before(() => {
  // clean out the DB before running the suite
  cy.exec('bin/spring rake cypress:db_setup')
  // have to do this initially in order to create the test area
  createNamedRoutes()
  createCypressTestArea()
})

beforeEach(() => {
  // have to alias the routes every time
  createNamedRoutes()
  cy.logout()
})
