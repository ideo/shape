Feature: Challenge settings
  Scenario: Setting up challenge settings through the settings modal
    Given I login and create an automated challenge
    Then I should see a collection card named "Automated Challenge Submissions"

    When I click on the first card
    And I click the "ListViewToggle"
    And I click the "RolesAdd"
    And I click on the first checkbox
    And I escape
    Then I should see ".avatar" element in a "ListCardRow"
