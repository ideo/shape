Feature: Capture Google Utm Params

  Scenario: Non-logged in visitors should see utm parameters copied
    Given I visit the Marketing Page with query string "?utm_source=facebook&utm_campaign=test-campaign-1&utm_content=test&utm_medium=mobile"
    When I login and visit My Collection
    Then I should see query string "?utm_source=facebook&utm_campaign=test-campaign-1&utm_content=test&utm_medium=mobile"
