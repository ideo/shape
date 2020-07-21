Feature: Challenge settings
  Scenario: Setting up challenge settings through the settings modal
    Given I login and visit My Collection

    And I visit URL "/automate/create_challenge"
    And I open the challenge settings
    Then I should see the "Challenge settings" modal

    When I click the "SubmissionSettings-AcceptNew"
    Then I should see "Accept new submissions (OFF)" in a "SubmissionSettings-AcceptNewText"
    When I click the "SubmissionSettings-HideNew"
    Then I should see "Hide new submissions" in a "SubmissionSettings-HideNew"

    When I click the "SubmissionSettings-TemplateEdit"
    Then I should see "challenge-template" in the URL

    When I open the challenge settings
    And I click the "ChallengeSettings-PeopleNav"
    And I click the "anyone-can-view-checkbox"
    And I click the "ConfirmButton"
    Then I should see "Allow anyone with this link to view (ON)" in a "anyone-can-view-checkbox"

    When I click the "ChallengeSettings-TopicsNav"
    And I type in a topic "bitcoin"
    And I press enter
    Then I should see "bitcoin" in a "Pill"

    When I click the "ChallengeSettings-PhasesNav"
    Then I should see 3 "ChallengeSettings-Phase"
    When I click the "CollectionDateRange"
    And I click on the first available date in the datepicker
    And I click on the last date in the datepicker
    And I click the "InlineModal-Ok"
    Then I should see "to" in a "CollectionDateRange"
    When I click the "ChallengeSettings-PhaseEdit"
    Then I should see "phase" in the URL
