Feature: Sharing a collection
  Scenario: Adding an existing org member to a collection and removing them
    Given I login and visit the Test Area
    And I click the ".AddButton"
    And I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for "@apiSearchUsersAndGroups" to finish
    Then I should see a "DialogContent"
    When I add "cypress-test-1@ideo.com" to the sharing dialog
    And I select to invite a new user into the collection
    Then I should see ".FormButton" not be disabled
    When I click the form add button in the sharing modal
    Then I should see 2 active users
    When I remove the user to the collection
    When I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for 1 second
    Then I should see 1 active user
    And I add "cypress-test-2@ideo.com" to the sharing dialog
    And I wait for '@apiSearchUsersAndGroups' to finish
    And I select to invite a new user into the collection
    Then I should see ".FormButton" not be disabled
    When I click the form add button in the sharing modal
    And I wait for 1 second
    Then I should see a pending user invite
