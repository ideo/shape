Feature: Viewing Audiences in Admin

  Scenario: Viewing an audience's criteria
    Given I login and visit the Admin area
    Then I should see "All Shape Feedback" in a "AdminHeader"

    When I click the info button for the first audience
    Then I should see the "My Test Audience Definition" modal
    Then I should see a "Label_audienceName"
    Then I should see the value "My Test Audience" in a "TextField_audienceName"
    Then I should see 3 "AdminAudienceCategory"
    Then I should see 5 "AdminAudienceCategoryOption"
    Then I should see "Age" in the 0 index "AdminAudienceCategory"
    Then I should see "Old" in the 0 index "AdminAudienceCategoryOption"
    Then I should see "Young" in the 1 index "AdminAudienceCategoryOption"
    Then I should see "Country" in the 1 index "AdminAudienceCategory"
    Then I should see "United States Of America" in the 2 index "AdminAudienceCategoryOption"
    Then I should see "Interest" in the 2 index "AdminAudienceCategory"
    Then I should see "Pets" in the 3 index "AdminAudienceCategoryOption"
    Then I should see "Athlete" in the 4 index "AdminAudienceCategoryOption"
    Then I should see a "CloseModalButton"

    When I click the "CloseModalButton"
    Then I should not see the "My Test Audience Definition" modal
    Then I should not see a "Label_audienceName"
