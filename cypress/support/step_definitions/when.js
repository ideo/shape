/* global When */

When('I create a collection named {string}', name => {
  cy.createCollection(name)
  cy.wait('@apiCreateCollectionCard')
})

When(
  'I navigate to the collection named {string} via the {string}',
  (name, el) => {
    cy.locate(el)
      .contains(name)
      .last()
      .click()
    cy.wait('@apiGetCollection')
  }
)

When('I capture the current URL', () => {
  cy.url().as('url')
})
