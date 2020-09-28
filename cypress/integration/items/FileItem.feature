Feature: File Item

  Scenario: Creating a file item from the BCT
    Given I login and visit the Test Area
    When I create a file item card using the first hot edge
    And I wait for "@fileStackApiPrefetch" to finish
    And I wait for "@fileStackApiPost" to finish
