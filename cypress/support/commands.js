import _ from 'lodash'
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

Cypress.Commands.add('login', ({ email } = {}) => {
  cy.request('GET', `/login_as?email=${email}`)
  cy.wait(100)
})

Cypress.Commands.add('loginAndVisitMyCollection', () => {
  cy.login({ email: 'cypress-test@ideo.com' })
  // go to My Collection, wait for loading to complete
  cy.visit('/')
  cy.wait('@apiGetCurrentUser')
  cy.wait('@apiGetCollectionCards')
})

Cypress.Commands.add('loginAndVisitAdmin', () => {
  cy.login({ email: 'cypress-test@ideo.com' })
  cy.visit('/admin')
  cy.wait('@apiGetCurrentUser')
  cy.wait('@apiAdminGetUsers')
  cy.wait('@apiAdminGetTestCollections')
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
      case 'foamcoreBoard':
        type = 'foamcoreBoard'
        break
      case 'test':
        type = 'testCollection'
        break
      default:
        // e.g. "normal"
        type = 'collection'
        break
    }

    if (collectionType === 'searchCollection') {
      cy.selectPopoutTemplateBctType({
        type: 'searchCollection',
        order: 'first',
        empty: false,
      })
    } else {
      cy.selectBctType({ type, empty })
    }

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

Cypress.Commands.add(
  'createCard',
  (cardType, { content = 'Testing', row, col } = {}) => {
    switch (cardType) {
      case 'textItem':
        cy.selectBctType({ type: 'text', order: 'first', row, col })
        cy.wait('@apiCreateCollectionCard')
        cy.wait(150)
        cy.get('.ql-editor')
          .first()
          .type(content)
        cy.wait(300)
        cy.locate('TextItemClose')
          .first()
          .click({ force: true })
        cy.wait(50)
        break
      case 'data':
        cy.selectPopoutTemplateBctType({
          type: 'report',
          order: 'first',
          empty: true,
        })
        break
      case 'submissionBox':
        cy.selectPopoutTemplateBctType({
          type: 'submissionBox',
          order: 'first',
          empty: false,
        })
        break
      case 'template':
        cy.selectPopoutTemplateBctType({
          type: 'template',
          order: 'first',
          empty: false,
        })
        break
      case 'searchCollection':
        cy.selectPopoutTemplateBctType({
          type: 'searchCollection',
          order: 'first',
          empty: false,
        })
        break
      default:
        cy.selectBctType({ type: cardType })
        break
    }
  }
)

Cypress.Commands.add('createTextItem', () => {
  cy.selectBctType({ type: 'text' })
  cy.get('.ql-editor')
    .first()
    .type('Testing')
  cy.locate('TextItemClose')
    .first()
    .click({ force: true })
  cy.wait('@apiUpdateItem')
  cy.wait('@apiCreateCollectionCard')
  cy.wait(50)
})

Cypress.Commands.add('resizeCard', (pos, size) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = _.map(sizes, Number)
  cy.window()
    .then(win => {
      const collection = win.uiStore.viewingCollection
      const f = pos === 'last' ? _.last : _.first
      const card = f(collection.sortedCards)
      collection.API_updateCard({
        card,
        updates: { width, height },
        undoMessage: 'Card resize undone',
      })
    })
    .wait('@apiUpdateCollection')
    .wait(1000)
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

Cypress.Commands.add(
  'selectBctType',
  ({ type, empty = false, order = 'last', row = null, col = null }) => {
    if (!empty) {
      let className = '.StyledHotspot'
      if (row !== null && col !== null) {
        className += `-${row}:${col}`
      }
      cy.locateDataOrClass(className)
        [order]()
        .click({ force: true })
    }
    switch (type) {
      case 'file':
        cy.wait(1000)
        break
      default:
        break
    }
    cy.locate(`BctButton-${type}`)
      .first()
      .click({ force: true })
  }
)

Cypress.Commands.add(
  'selectPopoutTemplateBctType',
  ({ type, empty = false, order = 'last' }) => {
    if (!empty) {
      cy.locateDataOrClass('.StyledHotspot')
        [order]()
        .click({ force: true })
    }
    cy.locate('BctButton-more')
      .last()
      .click({ force: true })
    cy.wait(100)
    switch (type) {
      case 'template':
        cy.locate('PopoutMenu_createTemplate')
          .first()
          .click({ force: true })
        cy.locate('CollectionCreatorTextField')
          .first()
          .click()
          .type('Test Template')
        break
      case 'report':
        cy.locate('PopoutMenu_createReport')
          .first()
          .click({ force: true })
        return
      case 'searchCollection':
        cy.locate('PopoutMenu_createSearchCollection')
          .first()
          .click({ force: true })
        return
      case 'submissionBox':
        cy.locate('PopoutMenu_createSubmissionBox')
          .first()
          .click({ force: true })
        cy.locate('CollectionCreatorTextField')
          .first()
          .click()
          .type('Submissions')
        break
      default:
        break
    }
    cy.locate(`CollectionCreatorFormButton`)
      .first()
      .click({ force: true })
    cy.wait('@apiCreateCollectionCard')
    if (['searchCollection', 'submissionBox'].includes(type)) {
      cy.wait('@apiGetCollectionCards')
    }
    cy.wait(50)
    return
  }
)

Cypress.Commands.add(
  'typeInTextarea',
  { prevSubject: true },
  (subject, string) => {
    return cy
      .wrap(subject)
      .clear()
      .wait(25)
      .type(string)
      .wait(25)
  }
)

// NOTE: https://stackoverflow.com/a/47537751/260495
// this hack is what allows cypress + fetch to work together, otherwise it doesn't
// work to use cy.wait(@route)
Cypress.on('window:before:load', win => {
  win.fetch = null
})
