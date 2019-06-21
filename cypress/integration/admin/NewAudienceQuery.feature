Feature: New Audience Query in Admin

  Scenario: Viewing an audience's criteria
    Given I login and visit the Admin area
    Then I should see "All Shape Feedback" in a "AdminHeader"

    When I click the new query button for the first audience
    Then I should see a "NewQueryCountTextField"

    When I type "25" in "NewQueryCountTextField"
    When I blur "NewQueryCountTextField"
    Then I should see the "Query the INA" modal
