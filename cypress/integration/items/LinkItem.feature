Feature: Link Item

  Scenario: Creating a link item from the BCT
    Given I login and visit the Test Area
    When I create a link item
    And I add a link URL "https://www.shape.space" and wait for "@externalUrl"
    And I wait for "@apiCreateCollectionCard" to finish
    Then I should see a "GridCard"
