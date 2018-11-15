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
  cy.route('DELETE', '/api/v1/sessions').as('apiLogout')
  cy.route('POST', '/api/v1/collection_cards').as('apiCreateCollectionCard')
  cy.route('PATCH', '/api/v1/collection_cards/archive').as(
    'apiArchiveCollectionCards'
  )
  cy.route('PATCH', '/api/v1/collection_cards/*/replace').as(
    'apiReplaceCollectionCard'
  )
  cy.route('GET', '/api/v1/collections/*').as('apiGetCollection')
  cy.route('GET', '/api/v1/test_collections/*').as('apiGetTestCollection')
  cy.route('GET', '/api/v1/collections/*/in_my_collection').as(
    'apiGetInMyCollection'
  )
  cy.route('PATCH', '/api/v1/collections/*').as('apiUpdateCollection')
  cy.route('PATCH', '/api/v1/test_collections/*/launch').as('apiLaunchTest')
  cy.route('PATCH', '/api/v1/test_collections/*/close').as('apiCloseTest')
  cy.route('PATCH', '/api/v1/test_collections/*/reopen').as('apiReopenTest')

  cy.route('GET', '/api/v1/search').as('apiSearch')
  // external routes
  cy.route('GET', '**/youtube/v3/videos*', 'fx:youtube-api').as('youtubeApi')
}

before(() => {
  // clean out the DB before running the suite
  cy.exec('bin/rake cypress:db_setup')
})

beforeEach(() => {
  // have to alias the routes every time
  createNamedRoutes()
  cy.logout()
})
