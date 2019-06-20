Feature: Sharing a collection
  Scenario: Adding an existing org member to a collection and removing them
    Given I login and visit the Test Area
    When I click the ".AddButton"
    And I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for "@apiSearchUsersAndGroups" to finish
    Then I should see a "DialogContent"
    When I add "cypress-test-1@ideo.com" to the sharing modal
    And I select to invite a new user
    Then I should see ".FormButton" not be disabled
    When I click the form add button in the collection sharing modal
    And I wait for 1 second
    And I add "cypress-test-2@ideo.com" to the sharing modal
    And I wait for '@apiSearchUsersAndGroups' to finish
    And I select to invite a new user
    Then I should see ".FormButton" not be disabled
    When I click the form add button in the collection sharing modal
    And I wait for 1 second
    And I remove the user from the collection sharing modal
    And I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for 1 second
    Then I should see 1 active user
