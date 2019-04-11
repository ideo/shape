import _ from 'lodash'
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

Cypress.Commands.add('login', ({ email } = {}) => {
  cy.request('GET', `/login_as?email=${email}`)
  cy.wait(100)
})

Cypress.Commands.add('logout', () => {
  cy.request('DELETE', '/api/v1/sessions')
})

Cypress.Commands.add('locateWith', (selector, text) =>
  cy.contains(`[data-cy="${selector}"]`, text)
)
Cypress.Commands.add(
  'locateDataOrClass',
  { prevSubject: 'optional' },
  (subject, selector) => {
    let findSelector = `[data-cy="${selector}"]`
    if (selector.indexOf('.') === 0) {
      findSelector = `[class^="${selector.substring(1)}-"]`
    }
    if (subject) {
      return subject.find(findSelector)
    }
    return cy.get(findSelector)
  }
)
// basically alias now
Cypress.Commands.add('locate', selector => cy.locateDataOrClass(selector))

Cypress.Commands.add('locateClassWith', (selector, text) =>
  cy.contains(`[class^="${selector}-"]`, text)
)
Cypress.Commands.add('locateDataOrClassWith', (selector, text) => {
  cy.locateDataOrClass(selector).contains(text)
})

Cypress.Commands.add(
  'createCollection',
  ({ name, collectionType = 'normal', empty = false }) => {
    let type = 'collection'
    // these types correspond to the BctButtonBox types in GridCardBlank
    switch (collectionType) {
      case 'test':
        type = 'testCollection'
        break
      default:
        // e.g. "normal"
        type = 'collection'
        break
    }
    cy.selectBctType({ type, empty })
    // force == don't care if it's "covered by tooltip"
    cy.locate('CollectionCreatorTextField').type(name, {
      force: true,
    })
    cy.locate('CollectionCreatorFormButton').click({ force: true })
    cy.wait('@apiCreateCollectionCard')
    // waiting a tiny bit here seems to allow the new card to actually finish creating/rendering
    cy.wait(50)
  }
)

Cypress.Commands.add('createTextItem', () => {
  cy.selectBctType({ type: 'text' })
  cy.get('.ql-editor')
    .first()
    .type('la dee daaaaa')
  cy.locate('TextItemClose')
    .first()
    .click({ force: true })
  cy.wait('@apiCreateCollectionCard')
  cy.wait(50)
})

Cypress.Commands.add('createDataItem', () => {
  cy.selectBctType({ type: 'report' })
  cy.wait('@apiCreateCollectionCard')
  cy.wait(50)
})

Cypress.Commands.add('resizeCard', (pos, size) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = _.map(sizes, Number)
  cy.window().then(win => {
    const collection = win.uiStore.viewingCollection
    const f = pos === 'last' ? _.last : _.first
    const card = f(collection.sortedCards)
    collection.API_updateCard({
      card,
      updates: { width, height },
      undoMessage: 'Card resize undone',
    })
    cy.wait('@apiUpdateCollection')
    cy.wait(100)
  })
})

Cypress.Commands.add('reorderFirstTwoCards', () => {
  cy.window().then(win => {
    const collection = win.uiStore.viewingCollection
    collection._reorderCards()
    const card = _.first(collection.sortedCards)
    collection.API_updateCard({
      card,
      updates: { order: 1.5 },
      undoMessage: 'Card move undone',
    })
    cy.wait('@apiUpdateCollection')
  })
})

Cypress.Commands.add('undo', () => {
  cy.window().then(win => {
    win.captureGlobalKeypress({
      code: 'KeyZ',
      ctrlKey: true,
    })
  })
})

Cypress.Commands.add('selectBctType', ({ type, empty = false }) => {
  if (!empty) {
    cy.locateDataOrClass('.StyledHotspot')
      .last()
      .click({ force: true })
  }
  if (type === 'report') {
    cy.locate('BctButton-more')
      .last()
      .click({ force: true })
    cy.wait(100)
    cy.locate('PopoutMenu_createReport')
      .first()
      .click({ force: true })
    return
  }
  cy.locate(`BctButton-${type}`)
    .first()
    .click({ force: true })
})

// NOTE: https://stackoverflow.com/a/47537751/260495
// this hack is what allows cypress + fetch to work together, otherwise it doesn't
// work to use cy.wait(@route)
Cypress.on('window:before:load', win => {
  win.fetch = null
})
