Feature: Creating a FoamcoreBoard Collection

  Scenario: Adding the FoamcoreBoard collection via the BCT
    Given I login and visit the Test Area
    When I create a foamcoreBoard collection named "Mural"
    Then I should see a collection card named "Mural"
    When I navigate to the collection named "Mural" via the "CollectionCover"
    Then I should see "Mural" in a "EditableNameHeading"
    Then I should see a "zoom-control"

    # TODO: test creating cards on the board
