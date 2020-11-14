Feature: Creating a FoamcoreBoard Collection

  Scenario: Adding the FoamcoreBoard collection via the BCT
    Given I login and visit the Test Area
    When I create a foamcoreBoard collection named "Mural" using the first hot edge
    Then I should see a collection card named "Mural"
    When I navigate to the collection named "Mural" via the "CollectionCover"
    Then I should see "Mural" in a "EditableNameHeading-recordName"
    Then I should see a "zoom-control"

    When I click the "foamcoreZoomIn"
    And I create a textItem card at 0,0 on the board with "Welcome!"
    And I create a textItem card at 0,1 on the board with "To my board."
    And I create a textItem card at 1,1 on the board with "Hello."
    # hotspot in between two cards
    When I click the "FoamcoreHotEdge-0:1"
    And I wait for "@apiGetCollectionCard" to finish

    # should move the card out of the way
    Then I should see the text "To my board." in the card at 0,2
    # closing it should move back
    When I wait for 1 second
    # click any quadrant
    And I click the "HotCellQuadrant-foamcoreBoard"
    And I click the "BCT-closeButton"
    Then I should see the text "To my board." in the card at 0,1

    # There should be a hotspot to the left of the 0,0 card
    And I create a text item card "Inserted!" using the first hot edge
    # should move both row 0 cards out of the way
    Then I should see the text "Inserted!" in the card at 0,0
    Then I should see the text "Welcome!" in the card at 0,1
    Then I should see the text "To my board." in the card at 0,2
    Then I should see the text "Hello." in the card at 1,1
