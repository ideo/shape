Feature: Video Item

  Scenario: Creating a video item from the BCT
    Given I login and visit the Test Area
    When I create a video item card "https://vimeo.com/340255030" using the first hot edge
    Then I should see a "GridCard"
    Then I should see a ".StyledVideoCover"
