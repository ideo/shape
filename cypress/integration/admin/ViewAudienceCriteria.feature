Feature: Viewing Audiences in Admin

  Scenario: Viewing an audience's criteria
    Given I login and visit the Admin area
    Then I should see "All Shape Feedback" in a "AdminHeader"

    When I click the info button for the first audience
    Then I should see the "My Test Audience" modal
    Then I should see 3 "AdminAudienceCategory"
    Then I should see 5 "AdminAudienceCategoryOption"
    Then I should see "Age" in the 0 index "AdminAudienceCategory"
    Then I should see "Old" in a "AdminAudienceCategoryOption"
    Then I should see "Young" in a "AdminAudienceCategoryOption"
    Then I should see "Country" in the 1 index "AdminAudienceCategory"
    Then I should see "United States Of America" in a "AdminAudienceCategoryOption"
    Then I should see "Interest" in the 2 index "AdminAudienceCategory"
    Then I should see "Pets" in a "AdminAudienceCategoryOption"
    Then I should see "Athlete" in a "AdminAudienceCategoryOption"
    Then I should see a "CloseModalButton"

    When I click the "CloseModalButton"
    Then I should not see the "My Test Audience" modal
