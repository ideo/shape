Feature: Template

  Scenario: Creating Template from the BCT
    Given I login and visit the Test Area
    When I create a template collection named "Test Template"
    Then I should see "Test Template" in a "GridCard"
    When I navigate to the collection named "Test Template" via the "CollectionCover"
    Then I should see "#template" in a ".SubduedHeading1"
