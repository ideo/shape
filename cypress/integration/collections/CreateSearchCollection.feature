Feature: Creating a Search Collection

  Scenario: Adding a Search collection via the BCT
    Given I login and visit the Test Area
    When I create a searchCollection collection named "cypress" using the first hot edge
    Then I should see a collection card named "cypress"

    When I navigate to the collection named "cypress" via the "CollectionCover"
    Then I should see "cypress" in a "EditableNameHeading-recordName"
    Then I should see a collection card named "Cypress Test Area"
    Then I should see "cypress" in a "EditableNameHeading-searchTerm"
    When I click the "EditableNameHeading-searchTerm"
    When I type " plants" in "EditableNameInput-searchTerm"
    Then I should see a "SearchCollectionEmptyMessage"
