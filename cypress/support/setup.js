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
  // users
  cy.route('GET', '/api/v1/users/me').as('apiGetCurrentUser')
  cy.route('DELETE', '/api/v1/sessions').as('apiLogout')
  cy.route('POST', '/api/v1/users/create_limited_user').as(
    'apiCreateLimitedUser'
  )

  // -- collection cards
  cy.route('POST', '/api/v1/collection_cards').as('apiCreateCollectionCard')
  cy.route('POST', '/api/v1/collection_cards/create_bct').as(
    'apiCreateCollectionCardBct'
  )

  // update has to be first so that later matches like collection_cards/move can be more specific
  cy.route('PATCH', '/api/v1/collection_cards/*').as('apiUpdateCollectionCard')
  cy.route('PATCH', '/api/v1/collection_cards/archive').as(
    'apiArchiveCollectionCards'
  )
  cy.route('PATCH', '/api/v1/collection_cards/move').as(
    'apiMoveCollectionCards'
  )
  cy.route('PATCH', '/api/v1/collection_cards/*/replace').as(
    'apiReplaceCollectionCard'
  )
  cy.route('PATCH', '/api/v1/collection_cards/*/toggle_pin').as('apiTogglePin')
  cy.route('GET', '/api/v1/collection_cards/*').as('apiGetCollectionCard')
  cy.route('GET', '/api/v1/collections/*/collection_cards*').as(
    'apiGetCollectionCards'
  )
  cy.route('GET', '/api/v1/collections/*/collection_cards/ids').as(
    'apiGetCollectionCardIds'
  )
  cy.route('DELETE', '/api/v1/collection_cards/*').as('apiDeleteCollectionCard')

  // -- collections
  cy.route('PATCH', '/api/v1/collections/*').as('apiUpdateCollection')
  cy.route('GET', '/api/v1/collections/*').as('apiGetCollection')
  cy.route('GET', '/api/v1/collections/*/challenge_phase_collections').as(
    'apiGetChallengePhaseCollections'
  )
  cy.route('GET', '/api/v1/collections/*/phase_sub_collections').as(
    'apiGetPhaseSubCollections'
  )
  cy.route('POST', '/api/v1/collections/create_template').as(
    'apiCreateTemplate'
  )
  cy.route('GET', '/api/v1/collections/*/in_my_collection').as(
    'apiGetInMyCollection'
  )

  // -- test collections
  cy.route('GET', '/api/v1/test_collections/*').as('apiGetTestCollection')
  cy.route('GET', '/api/v1/test_collections/*/validate_launch').as(
    'apiValidateLaunch'
  )
  cy.route('PATCH', '/api/v1/test_collections/*/launch').as('apiLaunchTest')
  cy.route('PATCH', '/api/v1/test_collections/*/close').as('apiCloseTest')
  cy.route('PATCH', '/api/v1/test_collections/*/reopen').as('apiReopenTest')

  cy.route('PATCH', '/api/v1/test_audiences/*').as('apiUpdateTestAudience')
  cy.route('PATCH', '/api/v1/test_audiences/*/toggle_status').as(
    'apiToggleAudienceStatus'
  )

  // -- survey responses
  cy.route('POST', '/api/v1/survey_responses').as('apiCreateSurveyResponse')
  cy.route('POST', '/api/v1/survey_responses/*/question_answers').as(
    'apiCreateQuestionAnswer'
  )

  // -- items
  cy.route('GET', '/api/v1/items/*').as('apiGetItem')
  cy.route('PATCH', '/api/v1/items/*').as('apiUpdateItem')
  cy.route('GET', '/api/v1/items/*/datasets').as('apiGetItemDataset')

  // -- orgs
  cy.route('POST', '/api/v1/organizations').as('apiCreateOrganization')
  cy.route('GET', '/api/v1/organizations/*/audiences').as(
    'apiGetOrganizationAudiences'
  )

  // -- groups
  cy.route('GET', '/api/v1/groups/*').as('apiGetGroup')
  cy.route('POST', '/api/v1/groups/**/roles').as('apiInviteUserToGroup')
  cy.route('DELETE', '/api/v1/groups/**/roles/**').as('apiDeleteGroupRoles')

  // -- comment threads
  cy.route('GET', '/api/v1/comment_threads/find_by_record/Collection/*').as(
    'apiGetCommentThread'
  )

  // -- datasets
  cy.route('PATCH', '/api/v1/datasets/*').as('apiUpdateDataset')

  // -- roles
  cy.route('POST', '/api/v1/collections/**/roles').as(
    'apiInviteUserToCollection'
  )
  cy.route('GET', '/api/v1/collections/**/roles/**').as('apiGetCollectionRoles')
  cy.route('DELETE', '/api/v1/collections/**/roles/**').as(
    'apiDeleteCollectionRoles'
  )

  // -- search
  cy.route('GET', '/api/v1/search/users_and_groups*').as(
    'apiSearchUsersAndGroups'
  )

  // -- admin
  cy.route('GET', '/api/v1/admin/users').as('apiAdminGetUsers')
  cy.route('GET', '/api/v1/admin/test_collections*').as(
    'apiAdminGetTestCollections'
  )

  // mock INA routes since we don't actually login
  cy.route('GET', '**/ideo-sso-profile-staging.herokuapp.com/**', {}).as(
    'ideoSsoApi'
  )
  // external routes
  cy.route('GET', '**/youtube/v3/videos*', 'fx:youtube-api').as('youtubeApi')
  cy.route('POST', '**/upload.filestackapi.com/prefetch').as(
    'fileStackApiPrefetch'
  )
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
