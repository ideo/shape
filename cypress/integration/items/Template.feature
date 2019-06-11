Feature: Template

  Scenario: Creating Template from the BCT
    Given I login and visit the Test Area
    When I create a template item
    Then I should see "Test Template" in a "GridCard"
    When I click "GridCard"
