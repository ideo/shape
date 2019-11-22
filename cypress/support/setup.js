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
  cy.route('PATCH', '/api/v1/collection_cards/move').as(
    'apiMoveCollectionCards'
  )
  cy.route('PATCH', '/api/v1/collection_cards/*/replace').as(
    'apiReplaceCollectionCard'
  )
  cy.route('GET', '/api/v1/collections/*').as('apiGetCollection')
  cy.route('GET', '/api/v1/collections/*/collection_cards*').as(
    'apiGetCollectionCards'
  )
  cy.route('PATCH', '/api/v1/collections/*').as('apiUpdateCollection')
  cy.route('GET', '/api/v1/test_collections/*').as('apiGetTestCollection')
  cy.route('GET', '/api/v1/collections/*/in_my_collection').as(
    'apiGetInMyCollection'
  )
  cy.route('GET', '/api/v1/test_collections/*/validate_launch').as(
    'apiValidateLaunch'
  )
  cy.route('PATCH', '/api/v1/test_collections/*/launch').as('apiLaunchTest')
  cy.route('PATCH', '/api/v1/test_collections/*/close').as('apiCloseTest')
  cy.route('PATCH', '/api/v1/test_collections/*/reopen').as('apiReopenTest')

  cy.route('GET', '/api/v1/items/*').as('apiGetItem')
  cy.route('PATCH', '/api/v1/items/*').as('apiUpdateItem')

  cy.route('POST', '/api/v1/organizations').as('apiCreateOrganization')
  cy.route('GET', '/api/v1/organizations/*/audiences').as(
    'apiGetOrganizationAudiences'
  )
  cy.route('GET', '/api/v1/groups/*').as('apiGetGroup')
  cy.route('POST', '/api/v1/groups/**/roles').as('apiInviteUserToGroup')
  cy.route('DELETE', '/api/v1/groups/**/roles/**').as('apiDeleteGroupRoles')

  cy.route('GET', '/api/v1/comment_threads/find_by_record/Collection/*').as(
    'apiGetCommentThread'
  )

  cy.route('POST', '/api/v1/survey_responses').as('apiCreateSurveyResponse')
  cy.route('POST', '/api/v1/survey_responses/*/question_answers').as(
    'apiCreateQuestionAnswer'
  )

  cy.route('PATCH', '/api/v1/test_audiences/*').as('apiUpdateTestAudience')

  cy.route('POST', '/api/v1/users/create_limited_user').as(
    'apiCreateLimitedUser'
  )

  cy.route('POST', '/api/v1/collections/**/roles').as(
    'apiInviteUserToCollection'
  )

  cy.route('GET', '/api/v1/collections/**/roles/**').as('apiGetCollectionRoles')

  cy.route('DELETE', '/api/v1/collections/**/roles/**').as(
    'apiDeleteCollectionRoles'
  )

  cy.route('GET', '/api/v1/search/users_and_groups*').as(
    'apiSearchUsersAndGroups'
  )
  // Admin routes
  cy.route('GET', '/api/v1/admin/users').as('apiAdminGetUsers')
  cy.route('GET', '/api/v1/admin/test_collections*').as(
    'apiAdminGetTestCollections'
  )

  // external routes
  cy.route('GET', '**/youtube/v3/videos*', 'fx:youtube-api').as('youtubeApi')
  cy.route('GET', '**/cloud.filestackapi.com/**').as('fileStackApi')
  cy.route('POST', '**/cloud.filestackapi.com/**').as('fileStackApiPost')
  cy.route('GET', '**/api.vimeo.com/**').as('vimeoApi')
  cy.route('GET', '**/*.googleapis.com/**', {}).as('googleApi')
  cy.route('POST', '**/*.googleapis.com/**', {}).as('googleApiPost')
  cy.route('GET', /passthru/, 'fx:blog').as('externalUrl')
}

before(() => {
  // clean out the DB before running the suite
  cy.exec('RAILS_ENV=test CYPRESS=true bin/rake cypress:db_setup')
  cy.exec('RAILS_ENV=test bin/rake searchkick:batch_reindex:all')
})

beforeEach(() => {
  // have to alias the routes every time
  createNamedRoutes()
  cy.logout()
})
