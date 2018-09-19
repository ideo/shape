/* global Then */

Then('I should see a collection card named {string}', name => {
  cy.locateWith('CollectionCover', name)
    .last()
    .should('be.visible')
})

Then('I should see {string} in a {string}', (text, el) => {
  cy.locateWith(el, text).should('be.visible')
})

Then('I should see the element {string}', el => {
  cy.locate(el).should('be.visible')
})

Then('the URL should match the captured URL', () => {
  cy.get('@url').then(url => {
    // we should be back on the previous url
    cy.url()
      .as('url')
      .should('eq', url)
  })
})
