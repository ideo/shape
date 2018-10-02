Feature: Undo actions

  Scenario: Performing several actions and then undoing them
    Given I login and visit the Test Area

    And I create a text item
    Then I should see a "TextItemCover" in the first card

    And I create a normal collection named "Hello World"
    And I resize the last card to 2x2
    Then I should see the last card as 2x2

    When I reorder the first two cards
    Then I should see a "CollectionCover" in the first card

    When I resize the first card to 3x1
    Then I should see the first card as 3x1

    When I undo with CTRL+Z
    Then I should see "Card resize undone" in a ".MuiSnackbarContent-message"
    Then I should see the first card as 1x1
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
    Then I should see the last card as 1x1

    # empty stack
    When I undo with CTRL+Z
    Then I should not see a ".MuiSnackbarContent-message"
