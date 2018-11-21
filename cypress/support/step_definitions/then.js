/* global Then */

Then('I should see a collection card named {string}', name => {
  cy.locateWith('CollectionCover', name)
    .last()
    .should('be.visible')
})

Then('I should see {string} in a {string}', (text, el) => {
  cy.locateDataOrClassWith(el, text).should('be.visible')
})

Then('I should see a {string} in the first card', el => {
  cy.locateDataOrClass('GridCard')
    .first()
    .should('be.visible')
})

Then('I should see the element {string}', el => {
  cy.locate(el).should('be.visible')
})

Then('I should see a {string}', selector => {
  cy.locateDataOrClass(selector).should('be.visible')
})

Then('I should not see a {string}', selector => {
  cy.locateDataOrClass(selector).should('not.be.visible')
})

Then('I should see {int} {string}', (num, el) => {
  cy.locateDataOrClass(el)
    .its('length')
    .should('eq', num)
})

Then('I should see the {word} card as {word}', (pos, size) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = sizes
  const selector = cy.locateDataOrClass('GridCard')
  const cardEl = pos === 'last' ? selector.last() : selector.first()
  cardEl.should('have.attr', 'data-width', width)
  cardEl.should('have.attr', 'data-height', height)
})

Then('the URL should match the captured URL', () => {
  cy.get('@url').then(url => {
    // we should be back on the previous url
    cy.url()
      .as('url')
      .should('eq', url)
  })
})

Then('I should see the no global search resuls for {string}', name => {
  cy.locateDataOrClass('.test-noSearchResults')
    .first()
    .should('be.visible')
})

Then(
  'I should see the {string} collection in the global search results',
  name => {
    cy.locateWith('CollectionCover', name)
      .last()
      .should('be.visible')
  }
)

Then('I should see {int} search results', amount => {
  cy.locateDataOrClass('CollectionCover')
    .its('length')
    .should('eq', amount)
})
