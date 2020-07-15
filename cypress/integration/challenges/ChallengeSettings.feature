Feature: Challenge settings
  Scenario: Setting up challenge settings through the settings modal
    Given I login and visit My Collection

    And I visit URL "/automate/create_challenge"
    And I open the challenge settings
    Then I should see the "Challenge Settings" modal

    When I click the "SubmissionSettings-SubmissionPanel"
    And I click the "SubmissionSettings-AcceptNew"
    Then I should see the value "OFF" in a "SubmissionSettings-AcceptNewText"
    When I click the "SubmissionSettings-AcceptNew"
    Then I should see the value "ON" in a "SubmissionSettings-AcceptNewText"

    When I click the "SubmissionSettings-TemplateEdit"
    Then I should see "challenge-template" in the URL

    When I open the challenge settings
    And I click the "SubmissionSettings-PeoplePanel"
    And I click the "anyone-can-view-checkbox"
    Then I should see "Allow anyone with this link to view (ON)" in a "anyone-can-view-checkbox"

    When I click the "EntityAvatarAndName"
    Then I should see the "Automated Challenge Admins" modal
