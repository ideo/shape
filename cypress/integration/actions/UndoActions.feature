Feature: Undo actions

  Scenario: Performing several actions and then undoing them
    Given I login and visit the Test Area

    And I create a text item
    Then I should see a "TextItemCover" in the first card

    And I create a normal collection named "Hello World"
    And I resize the last card to 2x2
    Then I should see the last of 3 cards as 2x2

    When I reorder the first two cards
    Then I should see a "CollectionCover" in the first card

    When I resize the first card to 3x1
    Then I should see the first of 3 cards as 3x1

    When I undo with CTRL+Z
    Then I should see "Card resize undone" in a ".MuiSnackbarContent-message"
    Then I should see the first of 3 cards as 1x1
    And I close the snackbar

    When I undo with CTRL+Z
    Then I should see "Card move undone" in a ".MuiSnackbarContent-message"
    Then I should see a "TextItemCover" in the first card
    And I close the snackbar

    # Navigate away, so that undo navigates me back
    When I capture the current URL
    And I navigate to the collection named "Hello World" via the "CollectionCover"

    And I wait for 1 second
    When I undo with CTRL+Z
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetInMyCollection" to finish
    # should navigate me back
    Then the URL should match the captured URL
    Then I should see "Card resize undone" in a ".MuiSnackbarContent-message"
    And I close the snackbar
    Then I should see the last of 3 cards as 1x1

    # Undo moving cards to a collection
    When I select the index 0 text card
    And I select the index 2 collection card
    And I click the action menu for the index 0 card
    And I click the move action for the index 0 card
    And I close the move helper modal
    Then I should see "2 in transit" in a ".MuiSnackbarContent-message"

    And I navigate to the collection named "Inner Collection" via the "CollectionCover"
    Then I should see "2 in transit" in a ".MuiSnackbarContent-message"
    And I click the down arrow on the MDL snackbar
    # verify cards are set down
    Then I should see a collection card named "Hello World"
    Then I should see a "TextItemCover" in the first card
    Then I should see the value "Testing" in the first text item
    And I close the snackbar
    When I undo with CTRL+Z
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetInMyCollection" to finish
    # Do we need to wait for move API call too?

    Then I should see a collection card named "Hello World"
    Then I should see a collection card named "Inner Collection"
    Then I should see a "TextItemCover" in the index 0 card
    Then I should see a "CollectionCover" in the index 1 card
    Then I should see a "CollectionCover" in the index 2 card

    # empty stack
    When I undo with CTRL+Z
    Then I should not see a ".MuiSnackbarContent-message"
