Feature: Creating a Collection

  Scenario: Opening BCT to create a collection
    Given I visit the Test Area
    When I create a collection named "Hello World"
    Then I should see a collection card named "Hello World"
    When I navigate to the collection named "Hello World" via the "CollectionCover"
    Then I should see "Hello World" in a "EditableNameHeading"

    When I capture the current URL
    And I create a collection named "Another One"
    Then I should see "Hello World" in a "Breadcrumb"
    When I navigate to the collection named "Hello World" via the "Breadcrumb"
    Then the URL should match the captured URL
