Feature: Linking Collections
  Scenario: Linking Collections using Action Menu
    Given I login and visit My Collection
    When I select the card at 0,2
    # pick up text item
    And I select the card at 0,2
    And I click the action menu for the card at 0,2
    And I click the link action for the card at 0,2
    And I close the move helper modal
    Then I should see "1 card selected to link" in a "snackbar-message"

    When I click the down arrow on the MDL snackbar
    And I wait for "@apiLinkCollectionCards" to finish
    And I wait for 1 second
    Then I should see a collection card named "Cypress Test Area"
