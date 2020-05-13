/* global When */
import _ from 'lodash'

const FLIPMOVE_DELAY = 600

When('I clear all cookies', () => {
  cy.clearCookies()
})

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

When('I create a {word} card', itemType => {
  cy.createCard(itemType)
})

When('I add a link URL {string} and wait for {string}', (url, request) => {
  cy.locate('BctTextField').type(url, {
    force: true,
  })
  cy.wait(request)
  cy.locate('LinkCreatorFormButton').click({ force: true })
})

When('I type {string} in the first quill editor', string => {
  cy.get('.ql-editor')
    .first()
    .click({ force: true })
    .wait(25)
    .type(string)
})

When('I close the first open text item', () => {
  cy.locate('TextItemClose')
    .first()
    .click({ force: true })
})

When('I choose a link item from the submission box', () => {
  cy.locateDataOrClass('DialogContent')
    .first()
    .children()
    .first()
    .children()
    .eq(3)
    .click({ force: true })
})

// ----------------------
// Sharing collections
// ----------------------
When('I click the form add button in the collection sharing modal', () => {
  cy.locate('Button').click({ force: true })
  cy.wait('@apiInviteUserToCollection')
  cy.wait('@apiSearchUsersAndGroups')
  cy.wait('@apiSearchUsersAndGroups')
})

When('I remove the user from the collection sharing modal', () => {
  cy.locateDataOrClass('.LeaveButton')
    .last()
    .click({ force: true })
  cy.wait('@apiGetCollectionRoles')
  cy.locateDataOrClass('ConfirmButton').click({ force: true })
  cy.wait('@apiDeleteCollectionRoles')
  cy.wait('@apiSearchUsersAndGroups')
  cy.wait('@apiSearchUsersAndGroups')
})

// ----------------------
// Group membership
// ----------------------
When('I click a sample group', () => {
  cy.get('.groupEdit').click({ force: true })
})

When('I click the form add button in the group sharing modal', () => {
  cy.locate('Button').click({ force: true })
  cy.wait('@apiInviteUserToGroup')
  cy.wait('@apiSearchUsersAndGroups')
  cy.wait('@apiSearchUsersAndGroups')
})

When('I remove the user from the group sharing modal', () => {
  cy.locateDataOrClass('.LeaveButton')
    .last()
    .click({ force: true })
  cy.locateDataOrClass('ConfirmButton').click({ force: true })
  cy.wait('@apiDeleteGroupRoles')
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

// ----------------------
// Editing cards
// ----------------------
When('I type {string} in the {word} textarea', (string, type) => {
  cy.get(`.edit-cover-${type}`).typeInTextarea(string)
})

When('I close the snackbar', () => {
  // NOTE: snackbar tests have proven fickle, so instead we just wait a bit for it
  // cy.locateDataOrClass('.MuiSnackbarContent-action')
  //   .find('button')
  //   .click({ force: true })
  // allow it to disappear
  cy.wait(300)
})

When('I place a card to the bottom using the snackbar', () => {
  // NOTE: snackbar tests have proven fickle, so instead we just wait a bit for it
  cy.locateDataOrClass('.MuiSnackbarContent-action')
    .find('button')
    .first()
    .click({ force: true })
  // allow it to disappear
  cy.wait(300)
})

// ----------------------
// Test Collection setup
// ----------------------
When('I add a link URL', () => {
  // assumes BCT is already open
  cy.locate(`BctButton-link`)
    .first()
    .click()
  cy.locate('BctTextField').type(
    'https://www.ideo.com/blog/why-coding-needs-to-be-a-conversation-not-a-list-of-commands',
    {
      force: true,
    }
  )
  cy.locate('LinkCreatorFormButton').click()
  cy.wait('@apiReplaceCollectionCard')
  // wait for card to reappear with the link media
  cy.wait(FLIPMOVE_DELAY)
})

When('I fill the last {string} with some text', string => {
  cy.locateDataOrClass(string)
    .last()
    .click()
    .type('Let me introduce my lovely prototype.')
})

When('I fill {string} with {string}', (string, url) => {
  cy.locateDataOrClass(string)
    .first()
    .click()
    .type(url)
})

When('I fill the {word} {string} with {string}', (num, element, string) => {
  let el = cy.locateDataOrClass(element)
  if (num === 'last') {
    el = el.last()
  } else {
    el = el.eq(parseInt(num) - 1)
  }
  el.click({ force: true })
    .wait(FLIPMOVE_DELAY)
    .type(string)
})

When('I add a test email for {string}', string => {
  cy.locateDataOrClass(string)
    .first()
    .click()
    .type('name@example.com')
})

When('I enter {string} as my category', string => {
  cy.locate('category-satisfaction-input')
    .first()
    .click()
    .type(string)
})

When('I enter {string} into group search', string => {
  cy.get('#react-select-chip input')
    .first()
    .click({ force: true })
    .type(string)
  cy.wait('@apiSearchUsersAndGroups')
  cy.locateDataOrClass('Autocomplete-Option-CypressTest')
    .first()
    .click({ force: true })
})

// NOTE: this just adds an open response in the "last" spot
When('I add an open response question with {string}', text => {
  cy.locate('QuestionHotEdgeButton')
    .last()
    .click({ force: true })
  cy.wait('@apiCreateCollectionCard')
  // have to wait for the flipmove fade-in
  cy.wait(FLIPMOVE_DELAY + 500)
  cy.locateDataOrClass('QuestionSelectOption-customizable')
    .last()
    .click()
  cy.wait(FLIPMOVE_DELAY)
  cy.locateDataOrClass('QuestionSelectOption-open-response')
    .last()
    .click()
  cy.wait('@apiReplaceCollectionCard')
  // have to wait for the flipmove fade-in
  cy.wait(FLIPMOVE_DELAY)

  cy.locate('QuestionContentEditorText')
    .last()
    .click()
    .type(text)
  cy.wait('@apiUpdateItem')
})

When('I accept the feedback survey terms', () => {
  cy.locate('AcceptFeedbackTerms')
    .last()
    .click()
  cy.wait(FLIPMOVE_DELAY)
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
    cy.wait('@apiGetCollectionCards')
    cy.wait('@apiGetCommentThread')
    cy.wait('@apiGetInMyCollection')
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

When('I click the last {string}', el => {
  cy.locateDataOrClass(el)
    .last()
    .click({ force: true })
})

When('I click the last answerable emoji', () => {
  cy.locateDataOrClass('ScaleEmojiBtn')
    .last()
    .click({ force: true })
    .wait('@apiCreateQuestionAnswer')
    .wait(FLIPMOVE_DELAY)
})

When('I wait for {string} to finish', apiCall => {
  cy.wait(apiCall)
})

When('I wait for {int} calls to {string} to finish', (num, apiCall) => {
  _.times(num, () => {
    cy.wait(apiCall)
  })
})

When('I wait for the collection to finish loading', () => {
  cy.wait('@apiGetCollection')
  cy.wait('@apiGetCollectionCards')
  cy.wait('@apiGetCommentThread')
  cy.wait('@apiGetInMyCollection')
})

When('I wait for {int} second(s)', num => {
  cy.wait(num * 1000)
})

When('I capture the current URL', () => {
  cy.url().as('url')
})

When('I visit the captured URL', () => {
  cy.get('@url').then(url => {
    cy.visit(url)
  })
})

// used for shortcutting a test
When('I visit URL {string}', url => {
  cy.visit(url)
})

When('I type some random things', () => {
  cy.get(
    '[data-cy="GridCard"][data-order="0"] [data-cy="CardAction-go to page"]'
  )
    .first()
    .click()
  cy.wait(1000)

  Cypress.on(
    'uncaught:exception',
    () =>
      // returning false here prevents Cypress from
      // failing the test
      false
  )

  // This wait gives the user time to add themselves to the text item
  cy.wait(5000)
  let i = 0
  while (i < 500) {
    const fakeText = `Hashtag polaroid waistcoat, chillwave iPhone chambray post-ironic banjo etsy letterpress brunch schlitz tote bag. Chambray 3-wolf-moon semiotics beard kombucha bespoke tousled. Coloring book whatever letterpress cred. Cliche glossier air plant shaman cray lomo authentic. Organic blue bottle 90's butcher banh mi heirloom. Plaid YOLO copper mug, edison bulb organic trust fund hammock beard street art umami.
Chambray intelligentsia roof party, man bun kombucha coloring book etsy ennui literally bushwick before they sold out tofu. Snackwave gentrify green juice freegan, brooklyn humblebrag selfies portland PBR&B normcore trust fund iceland affogato. Meh shaman fixie drinking vinegar, everyday carry vape viral normcore direct trade freegan cold-pressed church-key tumeric stumptown single-origin coffee. Synth bitters viral typewriter cliche sriracha.
Chicharrones snackwave whatever, narwhal fanny pack mustache synth shoreditch. Drinking vinegar tumeric thundercats scenester, keytar celiac farm-to-table retro bushwick polaroid single-origin coffee mlkshk. Knausgaard shaman aesthetic glossier kombucha squid tumeric readymade polaroid lomo. Godard 3 wolf moon snackwave palo santo gastropub cloud bread, heirloom williamsburg vexillologist air plant. Venmo jianbing asymmetrical bicycle rights, pop-up forage tofu. Wolf lyft pinterest listicle, vape franzen brooklyn letterpress tote bag food truck waistcoat raw denim.`
    const randChar = fakeText[i]
    const editor = cy.get('.ql-editor').first()
    editor.type(randChar)
    i += 1
    if (i % 15 === 0) {
      cy.wait(1000)
    }
  }
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

When('I type {string} in {string}', (text, element) => {
  cy.locateDataOrClass(element).type(text)
})

When('I blur {string}', element => {
  cy.locateDataOrClass(element).blur()
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
// Action Menu
// ----------------------

When('I click ... in the nav and select {string}', option => {
  cy.locate('PopoutMenu')
    .first()
    .click({ force: true })

  cy.locate(`PopoutMenu_${option}`).click()
})

// ----------------------
// Items
// ----------------------

When('I click the first text item', () => {
  cy.locate('TextItemCover')
    .first()
    .click({ force: true })
    .wait('@apiGetItem')
    // clicking text item + loading + initializing quill seems to be happier if we wait a bit
    .wait(500)
})

When('I edit the report item', () => {
  cy.locate('CardAction-Edit')
    .first()
    .click()
  cy.wait(100)
})

When('I select the index {int} {word} card', (pos, type) => {
  cy.get(
    `[data-cy="GridCard"][data-order="${pos}"] [data-cy="CardAction-select"]`
  )
    .first()
    .click()
  cy.wait(100)
})

When('I click the action menu for the index {int} card', pos => {
  cy.get(`[data-cy="GridCard"][data-order="${pos}"] [data-cy="PopoutMenu"]`)
    .first()
    .click({ force: true })
  cy.wait(100)
})

When('I click the {word} action for the index {int} card', (action, pos) => {
  const value = `PopoutMenu_${_.camelCase(action)}`
  cy.get(`[data-cy="GridCard"][data-order="${pos}"] [data-cy="${value}"]`)
    .first()
    .click({ force: true })
  cy.wait(100)
})

When('I click the {string} on the index {int} card', (action, pos) => {
  cy.get(`[data-cy="GridCard"][data-order="${pos}"] [data-cy="${action}"]`)
    .first()
    .click({ force: true })
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

// ----------------------
// Modals
// ----------------------
When('I close the move helper modal', () => {
  cy.locate('MoveHelperModal-closeBtn')
    .first()
    .click({ force: true })
  cy.wait(100)
})

When(
  'I choose to place the template instance elsewhere from the template helper modal',
  () => {
    cy.locate('MoveHelperModal-letMePlaceItBtn')
      .first()
      .click({ force: true })
    cy.wait(100)
  }
)

When(
  'I choose to add the template instance into my collection from the template helper modal',
  () => {
    cy.locate('MoveHelperModal-addToMyCollectionBtn')
      .first()
      .click({ force: true })
    cy.wait(100)
  }
)

When('I click the {word} arrow on the MDL snackbar', direction => {
  cy.locate(`MoveSnackbarArrow-${direction}`)
    .first()
    .click({ force: true })
  cy.wait(100)
})

// ----------------------
// Sharing Modal
// ----------------------
When('I add {string} to the sharing modal', email => {
  cy.get('#react-select-react-select-chip-input')
    .type(email, {
      force: true,
    })
    .wait('@apiSearchUsersAndGroups')
})

When('I select to invite a new user', () => {
  cy.get('.selectOption')
    .last()
    .children()
    .last()
    .click({ force: true })
})

// ----------------------
// Admin (Test Collection Feedback)
// ----------------------
When('I click the info button for the first audience', index => {
  cy.locate('AudienceInfoButton')
    .first()
    .click()
  cy.wait(100)
})

When('I click the new query button for the first audience', index => {
  cy.locate('NewQueryButton')
    .first()
    .click()
  cy.wait(100)
})
