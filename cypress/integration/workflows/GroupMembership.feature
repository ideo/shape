Feature: Group membership
  Scenario: Adding an existing org member to a group and removing them
    Given I login and visit My Collection
    When I click the "OrgMenuBtn"
    And I click the "PopoutMenu_peopleGroups"
    Then I should see a "DialogContent"
    When I click a sample group
    And I add "cypress-test-1@ideo.com" to the sharing modal
    And I select to invite a new user
    Then I should see "Button" not be disabled
    When I click the form add button in the group sharing modal
    And I wait for 1 second
    Then I should see 2 active users
    And I remove the user from the group sharing modal
    And I wait for "@apiSearchUsersAndGroups" to finish
    And I wait for "@apiSearchUsersAndGroups" to finish
    Then I should see 1 active user
