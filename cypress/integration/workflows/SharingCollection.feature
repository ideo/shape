Feature: Sharing a collection
Scenario: Adding people to a collection
  Given I login and visit the Test Area
  And I click the ".AddButton"
  Then I should see a "DialogContent"
  When I add an email to the sharing dialog
  And I wait for "@apiSearchUsersAndGroups" to finish
  And I wait for 1 second
  And I click ".MuiTouchRipple"
  Then I should see ".FormButton" not be disabled
  When I click ".FormButton"
  And I wait for "@apiSearchUsersAndGroups" to finish
  And I wait for 1 second
  Then I should see a pending user invite
