Feature: Creating an Organization

  Scenario: Opening the Organization Menu to create a new organization
    Given I login and visit the Test Area
    And I click the "OrgMenuBtn"
    And I click the "PopoutMenu_newOrganization"
    And I fill out the organization name with "Our Test Org"
    Then I should see the value "our-test-org" in a "TextField_groupHandle"

    When I click the "FormButton_submitGroup"
    And I wait for "@apiCreateOrganization" to finish
    Then I should see "Please wait while we build your account" in a "DialogPrompt"
    # note it might be "our-test-org-1" etc, this will match as RegExp
    Then I should see "our-test-org" in the URL
