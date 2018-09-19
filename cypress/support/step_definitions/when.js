/* global When */

When(
  'I create a {string} collection named {string}',
  (collectionType, name) => {
    cy.createCollection({ name, collectionType })
  }
)

When(
  'I create a {string} collection named {string} in my empty collection',
  (collectionType, name) => {
    cy.createCollection({ name, collectionType, empty: true })
  }
)

When(
  'I navigate to the collection named {string} via the {string}',
  (name, el) => {
    cy.locateWith(el, name)
      .last()
      .click()
    cy.wait('@apiGetCollection')
  }
)

When('I capture the current URL', () => {
  cy.url().as('url')
})
