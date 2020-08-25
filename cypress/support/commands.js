import _ from 'lodash'
import { FOAMCORE_GRID_BOUNDARY } from '~/utils/variables'

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

Cypress.Commands.add('loginAndCreateAutomatedChallenge', () => {
  cy.login({ email: 'cypress-test@ideo.com' })
  // after creating challenge it will redirect you back to My Collection
  cy.visit('/automate/create_challenge')
  cy.wait('@apiGetCurrentUser')
  cy.wait('@apiGetCollectionCards')
  cy.wait('@apiGetChallengePhaseCollections')
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

Cypress.Commands.add('selectCardAt', ({ row, col, value = null } = {}) => {
  let selector = `[data-cy="GridCard"][data-row="${row}"][data-col="${col}"]`
  if (value) {
    selector += ` [data-cy="${value}"]`
  }
  return cy.get(selector)
})

Cypress.Commands.add(
  'createCollection',
  ({ name, collectionType = 'normal', empty = false }) => {
    if (
      _.includes(
        ['template', 'searchCollection', 'submissionBox'],
        collectionType
      )
    ) {
      // these cards get created via the BCT popout (...) menu
      cy.selectPopoutTemplateBctType({
        type: collectionType,
        empty,
        name,
      })
    } else {
      let type = 'collection'
      // these types correspond to the BctButtonBox types in GridCardBlank
      if (collectionType === 'test') {
        type = 'testCollection'
      } else if (collectionType !== 'normal') {
        type = collectionType
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
  }
)

Cypress.Commands.add(
  'createCard',
  (cardType, { content = 'Testing', row, col, empty = false } = {}) => {
    switch (cardType) {
      case 'textItem':
        cy.selectBctType({ type: 'text', row, col, empty })
        cy.wait('@apiCreateCollectionCard')
        cy.wait(150)
        cy.get('.ql-editor')
          .first()
          .type(content)
        cy.wait(300)
        cy.locate('TextItemClose')
          .first()
          .click({ force: true })
        cy.wait('@apiUpdateItem')
        cy.wait(50)
        break
      case 'data':
        cy.selectPopoutTemplateBctType({
          type: 'report',
        })
        break
      case 'submissionBox':
        cy.selectPopoutTemplateBctType({
          type: 'submissionBox',
        })
        break
      case 'template':
        cy.selectPopoutTemplateBctType({
          type: 'template',
        })
        break
      case 'searchCollection':
        cy.selectPopoutTemplateBctType({
          type: 'searchCollection',
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

Cypress.Commands.add('resizeCard', ({ row, col, size }) => {
  // size e.g. "2x1" so we split on 'x'
  const sizes = size.split('x')
  const [width, height] = _.map(sizes, Number)
  cy.window()
    .then(async win => {
      const collection = win.uiStore.viewingCollection
      const card = _.find(collection.sortedCards, { row, col })
      await collection.API_updateCard({
        card,
        updates: { width, height },
        undoMessage: 'Card resize undone',
      })
      cy.wait(250)
    })
    .wait(500)
    .wait('@apiUpdateCollection')
    .wait(500)
})

Cypress.Commands.add('moveFirstCardDown', (row = 1) => {
  cy.window()
    .then(async win => {
      const collection = win.uiStore.viewingCollection
      const card = _.first(collection.sortedCards)
      await collection.API_updateCard({
        card,
        updates: { row, col: 0, updated_at: new Date() },
        undoMessage: 'Card move undone',
      })
      cy.wait(1000)
    })
    .wait('@apiUpdateCollection')
    .wait(500)
})

Cypress.Commands.add('undo', () => {
  cy.window().then(win => {
    win.captureGlobalKeypress({
      code: 'KeyZ',
      ctrlKey: true,
    })
  })
})

Cypress.Commands.add('clickFirstHotEdge', () => {
  cy.locateDataOrClass('FoamcoreHotspot-0:0')
    .first()
    .click({ force: true })
  cy.wait('@apiCreateCollectionCardBct')
  // this is when it gets the placeholder
  cy.wait('@apiGetCollectionCard')
  cy.wait(200)
})

Cypress.Commands.add(
  'selectBctType',
  ({ type, row = null, col = null, empty = false }) => {
    let className = '.StyledHotspot'
    if (row !== null && col !== null) {
      className += `-${row}:${col}`
    }
    if (!empty) {
      // we need to hover over the right spot to make the BCT appear
      cy.window().then(win => {
        // make sure we're at top left
        cy.scrollTo(0, 0)
        const { uiStore } = win
        // this is how we simulate a mouseover to create a blank hover spot
        const pos = uiStore.positionForCoordinates({
          row: row || 0,
          col: col || 0,
        })
        const rect = {
          // estimated values to simulate bounding rectangle
          left: 50,
          top: 150,
        }
        cy.get(`.${FOAMCORE_GRID_BOUNDARY}`)
          .trigger('mousemove', {
            clientX: pos.x + rect.left,
            clientY: pos.y + rect.top,
            force: true,
          })
          .wait(150)
          .locateDataOrClass(className)
          .first()
          .click({ force: true })
      })
    }
    cy.wait(type === 'file' ? 1000 : 150)
    cy.locate(`BctButton-${type}`)
      .first()
      .click({ force: true })
  }
)

Cypress.Commands.add(
  'selectPopoutTemplateBctType',
  ({ type, empty = false, name = '' }) => {
    cy.selectBctType({ type: 'more', empty })
    cy.wait(100)

    const popoutType = `PopoutMenu_create${_.upperFirst(type)}`
    cy.locate(popoutType)
      .first()
      .click({ force: true })

    switch (type) {
      case 'template':
      case 'searchCollection':
      case 'submissionBox':
        cy.locate('CollectionCreatorTextField')
          .first()
          .click()
          .type(name || `My ${type}`)
        break
      default:
        break
    }

    if (type === 'data' || type === 'report') {
      cy.wait('@apiCreateCollectionCard')
      cy.wait('@apiGetItemDataset')
    } else {
      cy.locate(`CollectionCreatorFormButton`)
        .first()
        .click({ force: true })
      cy.wait('@apiCreateCollectionCard')
    }

    if (['submissionBox'].includes(type)) {
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
