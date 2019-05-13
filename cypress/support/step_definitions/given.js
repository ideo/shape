/* global Given */

Given('I visit the Marketing Page', () => {
  // don't login
  cy.visit('/')
})

Given('I login and visit My Collection', () => {
  cy.loginAndVisitMyCollection()
})

Given('I login and visit the Test Area', () => {
  cy.loginAndVisitMyCollection()
  // navigate into collection
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
  cy.wait('@apiGetCollection')
  cy.wait('@apiGetCollectionCards')
})
