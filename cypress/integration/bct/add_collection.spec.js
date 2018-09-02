describe('BCT: Create Collection', () => {
  before(() => {
    cy.server()
    cy.route(
      'POST',
      '/api/v1/collection_cards',
      'fixture:create_collection_99.json'
    ).as('createCollectionCard')
    cy.route(
      'GET',
      '/api/v1/collections/99',
      'fixture:get_collection_99.json'
    ).as('getCollection')
  })

  beforeEach(() => {
    // go to a pre-existing empty collection
    cy.visit('/ideo/collections/31')
  })

  it('creates a new collection with the typed name', () => {
    // cy.locate('Hotspot').last().click()
    cy.locate('BctButton-collection').first().as('btn').trigger('mouseover')
    cy.get('.Tooltip').first()
      .should('contain', 'Create collection')
    // force == don't care if it's "covered by tooltip"
    cy.get('@btn').click({ force: true })
    cy.locate('CollectionCreatorTextField').type('Hello World', { force: true })
    cy.locate('CollectionCreatorFormButton').click()
    cy.wait('@createCollectionCard')
    cy.locate('CollectionCover').contains('Hello World').last().click()
  })
})
