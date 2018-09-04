Feature: Visiting My Collection

  Scenario: I visit my collection and see the "Shared with Me" card
    Given I visit My Collection
    Then I should see a collection card named "Shared with Me"
