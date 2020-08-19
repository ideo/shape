Feature: Undo actions

  Scenario: Performing several actions and then undoing them
    Given I login and visit the Test Area

    And I create a textItem card
    Then I should see a "TextItemCover" in the first card
    Then I should see the value "Testing" in the first text item

    # Testing undoing text item content changes
    When I click the first text item
    And I type " hello" in the first quill editor
    And I close the first open text item
    And I wait for 1 second
    Then I should see the value "Testing hello" in the first text item

    When I click the first text item
    And I type " there" in the first quill editor
    And I close the first open text item
    And I wait for 1 second
    Then I should see the value "Testing hello there" in the first text item

    When I undo with CTRL+Z
    And I wait for "@apiUpdateItem" to finish
    And I close the snackbar
    Then I should see the value "Testing hello" in the first text item

    When I undo with CTRL+Z
    And I wait for "@apiUpdateItem" to finish
    And I close the snackbar
    Then I should see the value "Testing" in the first text item

    # Testing undoing resizing collections, rename, and navigations
    When I create a normal collection named "Hello World"
    And I wait for 1 second
    And I resize the card at 0,2 to 2x2
    Then I should see the card at 0,2 as 2x2

    When I click the edit collection settings icon
    Then I should see a 'EditCoverOptions'
    # This is testing native browser text editing undo
    When I type "Undo" in the title textarea
    And I undo with CTRL+Z
    # This is testing our Shape undo that undoes a saved title edit
    And I type "New Title" in the title textarea
    And I click the 'ModalClose'
    And I wait for "@apiUpdateCollection" to finish
    Then I should see a collection card named "New Title"

    When I undo with CTRL+Z
    And I wait for "@apiUpdateCollection" to finish
    Then I should see a collection card named "Hello World"

    When I move the first card down 1 row
    Then I should see a "CollectionCover" in the card at 1,0

    # resize the card we just moved down
    When I resize the card at 1,0 to 2x1
    Then I should see the card at 1,0 as 2x1

    When I undo with CTRL+Z
    # NOTE: these snackbar content tests were inconsistent/problematic on Codeship
    # Then I should see "Card resize undone" in a "snackbar-message"
    And I wait for "@apiUpdateCollection" to finish
    Then I should see the card at 1,0 as 1x1
    And I close the snackbar

    When I undo with CTRL+Z
    # Then I should see "Card move undone" in a "snackbar-message"
    And I wait for "@apiUpdateCollection" to finish
    # card should be moved back
    Then I should see a "CollectionCover" in the card at 0,0
    And I close the snackbar

    # Navigate away, so that undo navigates me back
    When I capture the current URL
    And I navigate to the collection named "Hello World" via the "CollectionCover"

    And I wait for 1 second
    When I undo with CTRL+Z
    And I wait for the collection to finish loading
    # should navigate me back
    Then the URL should match the captured URL
    # Then I should see "Card resize undone" in a "snackbar-message"
    And I close the snackbar
    Then I should see the card at 0,2 as 1x1

    # Undo moving cards to a collection
    When I select the card at 0,1
    And I select the card at 0,2
    And I click the action menu for the card at 0,1
    And I click the move action for the card at 0,1
    And I close the move helper modal
    Then I should see "2 cards in transit" in a "snackbar-message"

    When I navigate to the collection named "Inner Collection" via the "CollectionCover"
    And I wait for 1 second
    Then I should see "2 cards in transit" in a "snackbar-message"

    When I click the down arrow on the MDL snackbar
    And I wait for "@apiMoveCollectionCards" to finish
    And I wait for 1 second
    Then I should see a collection card named "Hello World"
    Then I should see a "TextItemCover" in the first card
    Then I should see the value "Testing" in the first text item
    And I close the snackbar

    # test undoing the move
    When I undo with CTRL+Z
    And I wait for "@apiMoveCollectionCards" to finish
    And I wait for "@apiUpdateCollection" to finish
    And I wait for the collection to finish loading
    # ¯\_(ツ)_/¯
    And I wait for 5 seconds

    Then I should see a collection card named "Hello World"
    Then I should see a collection card named "Inner Collection"
    Then I should see a "CollectionCover" in the card at 0,0
    Then I should see a "TextItemCover" in the card at 0,1
    Then I should see a "CollectionCover" in the card at 0,2

# empty stack
# When I close the snackbar
# And I undo with CTRL+Z
# Then I should not see a "snackbar-message"
