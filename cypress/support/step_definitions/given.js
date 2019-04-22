/* global Given */

Given('I visit the Marketing Page', () => {
  // don't login
  cy.visit('/')
})

Given('I login and visit My Collection', () => {
  // user 4 is our test user
  cy.login({ email: 'cypress-test@ideo.com' })
  // go to My Collection
  cy.visit('/')
  cy.wait('@apiGetCurrentUser')
})

Given('I login and visit the Test Area', () => {
  cy.login({ email: 'cypress-test@ideo.com' })
  // go to My Collection
  cy.visit('/')
  cy.wait('@apiGetCurrentUser')
  // navigate into collection
  cy.locateWith('CollectionCover', 'Cypress Test Area')
    .last()
    .click()
})
