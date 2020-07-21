Feature: Challenge settings
  Scenario: Setting up challenge settings through the settings modal
    Given I login and visit My Collection

    And I visit URL "/automate/create_challenge"
    Then I should see a collection card named "Automated Challenge Submissions"

    When I click on the first card
    And I click the "ListViewToggle"
    And I click the "RolesAdd"
    And I click on the first checkbox
    And I escape
    Then I should see ".avatar" element in a "ListCardRow"
