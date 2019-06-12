Feature: File Item

  Scenario: Creating a file item from the BCT
    Given I login and visit the Test Area
    When I create a file item
    And I wait for "@fileStackApi" to finish
    And I wait for "@fileStackApiPost" to finish
    Then I should see a ".fsp-select"
