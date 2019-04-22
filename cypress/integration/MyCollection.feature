Feature: Visiting My Collection

  Scenario: I visit my collection and see the "Cypress Test Area" card
    Given I login and visit My Collection
    Then I should see a collection card named "Cypress Test Area"
