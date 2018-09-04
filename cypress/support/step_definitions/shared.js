/* global Given, When, Then */

// NOTE: all steps assume the beforeEach -> login has already happened
Given('I visit My Collection', () => {
  // go to My Collection
  cy.visit('/')
})

Given('I visit the Test Area', () => {
  // go to My Collection
  cy.visit('/')
  // navigate into collection
  cy.locate('CollectionCover').contains('Cypress Test Area').last().click()
})

//

When('I create a collection named {string}', (name) => {
  cy.createCollection(name)
  cy.wait('@apiCreateCollectionCard')
})

When('I navigate to the collection named {string} via the {string}', (name, el) => {
  cy.locate(el).contains(name).last().click()
  cy.wait('@apiGetCollection')
})

When('I capture the current URL', () => {
  cy.url().as('url')
})

// Assertions
Then('I should see a collection card named {string}', (name) => {
  cy.locate('CollectionCover')
    .contains(name).last()
    .should('be.visible')
})

Then('I should see {string} in a {string}', (text, el) => {
  cy.locate(el)
    .should('contain', text)
})

Then('the URL should match the captured URL', () => {
  cy.get('@url').then(url => {
    // we should be back on the previous url
    cy.url().as('url')
      .should('eq', url)
  })
})
