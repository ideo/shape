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
  cy.locateDataOrClass('.StyledGridCard')
    .first()
    .locateDataOrClass(el)
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

Then('I should see the {word} card as {word}', (pos, size) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = sizes
  const selector = cy.locateDataOrClass('.StyledGridCard')
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
