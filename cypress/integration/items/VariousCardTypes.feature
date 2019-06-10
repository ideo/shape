Feature: Creating Various Card Types

  Scenario: Creating a link item
    Given I login and visit the Test Area
    When I create a link item
    And I fill "BctTextField" with "https://www.shape.space"
    And I wait for 1 second
    And I click the "LinkCreatorFormButton"
    And I wait for "@apiCreateCollectionCard" to finish
    Then I should see a "GridCard"
    Then I should see a ".StyledLinkCover"

  Scenario: Creating a video item
    Given I login and visit the Test Area
    When I create a video item
    And I fill "BctTextField" with "https://vimeo.com/340255030"
    And I wait for 1 second
    And I click the "LinkCreatorFormButton"
    And I wait for "@apiCreateCollectionCard" to finish
    Then I should see a "GridCard"
    Then I should see a ".StyledVideoCover"

  Scenario: Creating a foam core board
    Given I login and visit the Test Area

    When I create a foamcoreBoard collection named "foamcoreBoard"
    Then I should see "foamcoreBoard" in a "GridCard"

  Scenario: Creating a file item
    Given I login and visit the Test Area
    When I create a file item
    And I wait for "@fileStackApi" to finish
    Then I should see a ".fsp-select"
