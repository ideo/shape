Feature: Creating a Test Collection

  Scenario: Adding the test collection via the BCT
    Given I login and visit the Test Area
    When I create a board collection named "Mural"
    Then I should see a collection card named "Mural"
    When I navigate to the collection named "Mural" via the "CollectionCover"
    Then I should see "Mural" in a "EditableNameHeading"

    # Test navigating back to the parent collection via the breadcrumb
    When I capture the current URL
    And I create a normal collection named "Another One" in my empty collection
    And I navigate to the collection named "Another One" via the "CollectionCover"
    Then I should see "Mural" in a "Breadcrumb"
    When I navigate to the collection named "Mural" via the breadcrumb
    Then the URL should match the captured URL
