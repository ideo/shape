Feature: Link Item

  Scenario: Creating a link item from the BCT
    Given I login and visit the Test Area
    When I create a link item card "https://www.shape.space" using the first hot edge
    Then I should see a "GridCard"
