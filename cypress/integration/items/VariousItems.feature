Feature: Various Items

  Scenario: Creating a Video Item
    Given I login and visit the Test Area

    When I create a video item
    And I fill "BctTextField" with "https://vimeo.com/340255030"
    And I wait for 1 second
    And I click the "LinkCreatorFormButton"
    And I wait for "@apiCreateCollectionCard" to finish
    Then I should see a "GridCard"
    Then I should see a ".StyledVideoCover"
