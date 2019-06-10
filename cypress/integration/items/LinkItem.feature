Feature: Link Item

  Scenario: Creating a link item from the BCT
    Given I login and visit the Test Area
    When I create a link item
    And I add a link URL "https://www.shape.space"
    And I wait for "@apiCreateCollectionCard" to finish
    Then I should see "Why Coding Needs" in a "GridCard"
