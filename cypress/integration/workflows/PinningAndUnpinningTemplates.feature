Feature: Pinning and Unpinning
  Scenario: Pin and Unpinned Area
    Given I login and visit the Test Area
    When I create a template card
    And I navigate to the collection named "Test Template" via the "CollectionCover"
    And I create a textItem card at 0,0 on the board with "Pin me!"
    And I create a textItem card at 0,1 on the board with "Unpinned."
    And I create a textItem card at 1,1 on the board with "2nd unpinned."
    And I create a textItem card at 1,2 on the board with "Pin me too!"

    And I click the "CardAction-Pin to Template" on the index 0 card
    And I click the "CardAction-Pin to Template" on the index 3 card

    # check that the buttons have changed
    Then I should see a "CardAction-Unpin from Template" in the card at 0,0
    Then I should see a "CardAction-Pin to Template" in the card at 0,1
    Then I should see a "CardAction-Pin to Template" in the card at 1,1
    Then I should see a "CardAction-Unpin from Template" in the card at 1,2

  Scenario: Creating unpinned cards will enable moving cards in the instance
    Given I login and visit the Test Area

    And I navigate to the collection named "Cypress Test Area" via the breadcrumb
    And I click the 'CollectionCoverFormButton'
    And I choose to place the template instance elsewhere from the template helper modal
    And I place a card to the bottom using the snackbar
    And I wait for '@apiCreateTemplate' to finish
    And I navigate to the collection named "My Test Template" via the "CollectionCover"
    And I wait for 1 seconds
    Then I should see a "PinnedIcon" in the card at 0,0
    Then I should not see a "PinnedIcon" in the card at 0,1
    Then I should not see a "PinnedIcon" in the card at 1,1
    Then I should see a "PinnedIcon" in the card at 1,2

    When I select the index 0 text card
    When I select the index 1 text card
    When I select the index 2 text card
    When I select the index 3 text card
    And I click the move action for the card at 1,1
    And I close the move helper modal
    And I click the down arrow on the MDL snackbar

    # pinned cards should not have moved
    Then I should see a "PinnedIcon" in the card at 0,0
    # these should have moved
    Then I should not see a "PinnedIcon" in the card at 1,3
    Then I should not see a "PinnedIcon" in the card at 2,3
    # pinned cards should not have moved
    Then I should see a "PinnedIcon" in the card at 1,2
