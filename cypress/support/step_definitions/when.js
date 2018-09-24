/* global When */

const FLIPMOVE_DELAY = 350

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
  cy.wait(FLIPMOVE_DELAY)
  cy.locateClass('QuestionSelectHolder')
    .eq(3)
    .find('.select')
    .click()
  cy.locateWith('QuestionSelectOption', 'Open Response')
    .first()
    .click()
  cy.wait('@apiReplaceCollectionCard')
  // have to wait for the flipmove fade-in
  cy.wait(FLIPMOVE_DELAY)

  cy.locate('DescriptionQuestionText')
    .last()
    .click()
    .type('What do you think about pizza?')
})

When(
  'I navigate to the collection named {string} via the {string}',
  (name, el) => {
    cy.locateWith(el, name)
      .last()
      .click()
    cy.wait('@apiGetCollection')
  }
)

When('I click the {string} containing {string}', (el, text) => {
  cy.locateWith(el, text)
    .first()
    .click()
})

When('I wait for {string} to finish', apiCall => {
  cy.wait(apiCall)
})

When('I capture the current URL', () => {
  cy.url().as('url')
})

When('I logout and visit the Marketing Page', () => {
  cy.logout().then(() => cy.visit('/'))
})
