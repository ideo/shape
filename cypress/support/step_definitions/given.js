/* global Given */

Given('I visit the Marketing Page', () => {
  // don't login
  cy.visit('/')
})

Given('I visit the Marketing Page with query string {string}', queryString => {
  cy.visit(`/${queryString}`)
})

Given('I login and visit My Collection', () => {
  cy.loginAndVisitMyCollection()
  Cypress.on(
    'uncaught:exception',
    () =>
      // returning false here prevents Cypress from
      // failing the test
      false
  )
})

Given('I login and visit the Admin area', () => {
  cy.loginAndVisitAdmin()
})

Given('I login and visit the Test Area', () => {
  cy.loginAndVisitMyCollection()
  // navigate into collection
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
  cy.wait('@apiGetCollection')
  cy.wait('@apiGetCollectionCards')
  Cypress.on(
    'uncaught:exception',
    () =>
      // returning false here prevents Cypress from
      // failing the test
      false
  )
})

Given('I visit the Test Area', () => {
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
  cy.wait('@apiGetCollection')
  cy.wait('@apiGetCollectionCards')
  Cypress.on(
    'uncaught:exception',
    () =>
      // returning false here prevents Cypress from
      // failing the test
      false
  )
})

Given('I login and create an automated challenge', () => {
  cy.loginAndCreateAutomatedChallenge()
  Cypress.on('uncaught:exception', e => {
    // returning false here prevents Cypress from
    // failing the test
    return false
  })
})

Given('I logout', () => {
  cy.logout()
})
