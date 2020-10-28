/* global Given */

const catchCypressException = () => {
  Cypress.on('uncaught:exception', e => {
    // returning false here prevents Cypress from failing the test,
    // otherwise redirects (e.g. loginAndVisit...) seem to cause a strange 4000ms timeout
    return false
  })
}

Given('I visit the Marketing Page', () => {
  // don't login
  cy.visit('/')
})

Given('I visit the Marketing Page with query string {string}', queryString => {
  cy.visit(`/${queryString}`)
})

Given('I login and visit My Collection', () => {
  cy.loginAndVisitMyCollection()
  catchCypressException()
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
  catchCypressException()
})

Given('I visit the Test Area', () => {
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
  cy.wait('@apiGetCollection')
  cy.wait('@apiGetCollectionCards')
  catchCypressException()
})

Given('I login and create an automated challenge', () => {
  cy.loginAndCreateAutomatedChallenge()
  catchCypressException()
})

Given('I logout', () => {
  cy.logout()
})
