Feature: Pinning and Unpinning
  Scenario: Pin and Unpinned Area
    Given I login and visit the Test Area
    When I create a template card
    And I navigate to the collection named "Test Template" via the "CollectionCover"
    And I create a emptyCollection collection named "Unpinned Collection 1"
    And I create a normal collection named "To Pin then Unpin"
    And I create a normal collection named "Pinned Collection 1"
    And I create a normal collection named "Pinned Collection 2"
    # will reorder cards based on pinned/order
    And I click the "CardAction-Pin to Template" on the index 0 card
    And I click the "CardAction-Pin to Template" on the index 2 card
    Then I should see a collection card named "Unpinned Collection 1" in the index 2

    When I click the action menu for the index 3 card
    And I click the move action for the index 3 card
    And I close the move helper modal
    And I click the up arrow on the MDL snackbar
    Then I should see a collection card named "To Pin then Unpin" in the index 0

    When I click the "CardAction-Unpin from Template" on the index 0 card
    Then I should see a collection card named "To Pin then Unpin" in the index 2

  Scenario: Creating unpinned cards will enable moving cards in the instance
    Given I login and visit the Test Area
    When I create a template card
    And I navigate to the collection named "Test Template" via the "CollectionCover"
    And I create a emptyCollection collection named "Test Collection 1"
    And I create a textItem card
    And I navigate to the collection named "Cypress Test Area" via the breadcrumb
    And I click the 'CollectionCoverFormButton'
    And I choose to place the template instance elsewhere from the template helper modal
    And I place a card to the bottom using the snackbar
    And I wait for '@apiCreateTemplate' to finish
    And I navigate to the collection named "My Test Template" via the "CollectionCover"
    And I wait for 1 seconds
    And I reorder the first two cards
    Then I should see a "CollectionCover" in the first card
