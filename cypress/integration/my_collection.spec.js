describe('My Collection', () => {
  it('successfully loads and displays "Shared with Me"', () => {
    cy.visit('/')
    cy.locate('CollectionCover').contains('Shared with Me').first()
      .should('be.visible')
  })
})
