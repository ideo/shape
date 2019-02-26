/* global When */
import _ from 'lodash'

const FLIPMOVE_DELAY = 600

// ----------------------
// Creating content (BCT)
// ----------------------
When('I create a {word} collection named {string}', (collectionType, name) => {
  cy.createCollection({ name, collectionType })
})

When(
  'I create a {word} collection named {string} in my empty collection',
  (collectionType, name) => {
    cy.createCollection({ name, collectionType, empty: true })
  }
)

When('I create a text item', num => {
  cy.createTextItem()
})

When('I create a data item', num => {
  cy.createDataItem()
})

// ----------------------
// Resizing/moving cards
// ----------------------
When('I resize the {word} card to {word}', (pos, size) => {
  cy.resizeCard(pos, size)
})

When('I reorder the first two cards', () => {
  cy.reorderFirstTwoCards()
})

When('I undo with CTRL+Z', () => {
  cy.undo()
})

When('I close the snackbar', () => {
  cy.locateDataOrClass('.MuiSnackbarContent-action')
    .find('button')
    .click()
  // allow it to disappear
  cy.wait(1200)
})

// ----------------------
// Test Collection setup
// ----------------------
When('I add a video', () => {
  // assumes BCT is already open
  cy.locate(`BctButton-video`)
    .first()
    .click()
  cy.locate('BctTextField').type(
    'https://www.youtube.com/watch?v=Zha0xYuF8dw',
    {
      force: true,
    }
  )
  cy.locate('LinkCreatorFormButton').click()
})

When('I add a test description', () => {
  cy.locate('DescriptionQuestionText')
    .first()
    .click()
    .type('Let me introduce my lovely prototype.')
})

When('I add an open response question', () => {
  cy.locate('QuestionHotEdgeButton')
    .last()
    .click()
  cy.wait('@apiCreateCollectionCard')
  // have to wait for the flipmove fade-in
  cy.wait(FLIPMOVE_DELAY + 3000)
  cy.locateDataOrClass('.QuestionSelectHolder')
    .eq(3)
    .find('.select')
    .click()
  cy.locateWith('QuestionSelectOption', 'Open Response')
    .first()
    .click()
  cy.wait(FLIPMOVE_DELAY)
  cy.wait('@apiReplaceCollectionCard')
  // have to wait for the flipmove fade-in
  cy.wait(FLIPMOVE_DELAY)

  cy.locate('DescriptionQuestionText')
    .last()
    .click()
    .type('What do you think about pizza?')
})

// ----------------------
// Navigation
// ----------------------
When(
  'I navigate to the collection named {string} via the {string}',
  (name, el) => {
    cy.locateWith(el, name)
      .last()
      .click({ force: true })
    cy.wait('@apiGetCollection')
  }
)

When('I navigate to the collection named {string} via the breadcrumb', name => {
  cy.locateWith('Breadcrumb', name)
    .last()
    .find('a')
    .click({ force: true })
  cy.wait('@apiGetCollection')
})

When('I click the {string} containing {string}', (el, text) => {
  cy.locateDataOrClassWith(el, text)
    .first()
    .click({ force: true })
})

When('I click the {string}', el => {
  cy.locateDataOrClass(el)
    .first()
    .click({ force: true })
})

When('I wait for {string} to finish', apiCall => {
  cy.wait(apiCall)
})

When('I wait for {int} second(s)', num => {
  cy.wait(num * 1000)
})

When('I capture the current URL', () => {
  cy.url().as('url')
})

When('I logout and visit the Marketing Page', () => {
  cy.logout()
  // not sure what's up with this, seems to still be logged in if you don't wait
  cy.wait(5000)
  cy.visit('/')
})

When('I visit the current Test URL', () => {
  cy.get('@url').then(url => {
    const id = _.last(url.split('/'))
    cy.visit(`/tests/${id}`)
  })
})

// ----------------------
// Organization Menu
// ----------------------

When('I fill out the organization name with {string}', orgName => {
  cy.locate('TextField_groupName')
    .first()
    .click()
    .type(orgName)
})

// ----------------------
// Items
// ----------------------

When('I edit the report item', () => {
  cy.locate('CardAction-Edit')
    .first()
    .click()
  cy.wait(100)
})

When(
  'I select {string} on the {string} select on the report item',
  (option, select) => {
    cy.locate(`DataReportSelect-${select}`)
      .first()
      .click()
    cy.wait(50)
    cy.locate(`DataReportOption-${option}`)
      .first()
      .click()
    cy.wait(50)
  }
)
