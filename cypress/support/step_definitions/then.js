/* global Then */
import { hexToRgb } from '~/utils/hexToRgba'

Then('I should see a collection card named {string}', name => {
  cy.locateWith('CollectionCover', name)
    .last()
    .should('be.visible')
})

Then(
  'I should see a collection card title {string} with a subtitle {string} and color {string}',
  (title, subtitle, hex) => {
    cy.locateDataOrClass('CollectionCover').within(cover => {
      cy.contains(title)
        .last()
        .should('be.visible')
        // hex color gets converted to rgb when applied
        .and('have.css', 'color', hexToRgb(hex))
      cy.contains(subtitle)
        .last()
        .should('be.visible')
        .and('have.css', 'color', hexToRgb(hex))
    })
  }
)

Then('I should not see a collection card with subtitle {string}', subtitle => {
  cy.locateDataOrClass('CollectionCover')
    .find('.bottom')
    .last()
    .invoke('text')
    .should('not.eq', subtitle)
})

Then('I should see {string} in a {string}', (text, el) => {
  cy.locateDataOrClassWith(el, text).should('be.visible')
})

Then('I should see {string} element in a {string}', (el, outerEl) => {
  cy.locateDataOrClass(outerEl).within(outer => {
    cy.get(el).should('be.visible')
  })
})

Then('I should see the value {string} in a {string}', (text, el) => {
  cy.locateDataOrClass(el).should('have.value', text)
})

Then('I should see a {string} in the card at {int},{int}', (el, row, col) => {
  cy.selectCardAt({ row, col })
    .locateDataOrClass(el)
    .first()
    .should('be.visible')
})

Then(
  'I should see the text {string} in the card at {int},{int}',
  (text, row, col) => {
    cy.contains(
      `[data-cy="GridCard"][data-row="${row}"][data-col="${col}"]`,
      text
    )
      .first()
      .should('be.visible')
  }
)

Then(
  'I should not see a {string} in the card at {int},{int}',
  (el, row, col) => {
    cy.selectCardAt({ row, col })
      .locateDataOrClass(el)
      .should('not.exist')
  }
)

Then('I should see the element {string}', el => {
  cy.locate(el).should('be.visible')
})

Then('I should have an element named {string}', el => {
  cy.locateDataOrClass(el).should('exist')
})

Then('I should see a {string}', selector => {
  cy.locateDataOrClass(selector).should('be.visible')
})

Then('I should not see a {string}', selector => {
  cy.locateDataOrClass(selector).should('not.exist')
})

Then('I should see {int} {string}', (num, el) => {
  cy.locateDataOrClass(el)
    .its('length')
    .should('eq', num)
})

Then('I should see {int} for the single data value', num => {
  const dataValue = cy.get('[data-cy="DataReport-count"]')
  dataValue.should('contain', num)
})

Then('I should see the single data value', () => {
  const dataValue = cy.get('[data-cy="DataReport-count"]')
  dataValue.should('exist')
})

Then('I should see an svg on the report item', () => {
  cy.get('[data-cy="ChartContainer"] svg')
    .first()
    .should('exist')
})

Then('I should see a modal', () => {
  cy.get('[role="dialog"]')
    .first()
    .should('exist')
})

Then('I should see the {string} modal', modalTitle => {
  cy.get(`[role="dialog"][aria-labelledby="${modalTitle}"]`)
    .first()
    .should('exist')
})

Then('I should not see the {string} modal', modalTitle => {
  cy.get(`[role="dialog"][aria-labelledby="${modalTitle}"]`).should('not.exist')
})

Then('I should see the card at {int},{int} as {word}', (row, col, size) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = sizes
  const cardEl = cy.selectCardAt({ row, col })
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

Then('I should see {string} in the URL', slug => {
  cy.url()
    .as('url')
    .should('match', new RegExp(slug))
})

Then('I should see {string} deselected', selector => {
  cy.locateDataOrClass(selector)
    .first()
    .should('have.css', 'opacity', '0.2')
})

Then(
  'I should see a question with {string} and {int} emojis',
  (selector, count) => {
    cy.locateDataOrClass(selector)
      .locateDataOrClass('emoji')
      .should('have.length', count)
  }
)

Then('I should see the value {string} in the first text item', text => {
  cy.get('.ql-editor')
    .first()
    .should('contain', text)
})

Then('I should see {string} not be disabled', selector => {
  cy.locateDataOrClass(selector)
    .first()
    .should('not.be.disabled')
})

// https://docs.cypress.io/api/commands/eq.html#Yields
Then(
  'I should see {string} in the {int} index {string}',
  (text, pos, selector) => {
    cy.get(`[data-cy="${selector}"]`)
      .eq(pos)
      .should('contain', text)
  }
)

Then('I should see {int} active user(s)', num => {
  cy.locateDataOrClass('role-row').should('have.length', num)
})

Then('I should see query parameters {string}', queryString => {
  cy.location().should(location => {
    expect(location.search).to.eq(queryString)
  })
})
