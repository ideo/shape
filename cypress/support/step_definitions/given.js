/* global Given */

// NOTE: all steps assume the beforeEach -> login has already happened
Given('I visit My Collection', () => {
  // go to My Collection
  cy.visit('/')
})

Given('I visit the Test Area', () => {
  // go to My Collection
  cy.visit('/')
  // navigate into collection
  cy.locate('CollectionCover')
    .contains('Cypress Test Area')
    .last()
    .click()
})

Given('I logout and visit the Marketing Page', () => {
  cy.logout()
  cy.visit('/')
})
