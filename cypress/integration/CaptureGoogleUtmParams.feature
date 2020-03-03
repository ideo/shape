Feature: Capture Google Utm Params

  Scenario: Non-logged in visitors should see utm parameters copied
    Given I visit the Marketing Page with query string "?utm_campaign=test-campaign-1&utm_content=test&utm_medium=mobile&utm_source=facebook"
    When I login and visit My Collection
    # NOTE: this order is important because params will have been re-sorted alphabetically at this point
    Then I should see query parameters "?utm_campaign=test-campaign-1&utm_content=test&utm_medium=mobile&utm_source=facebook"
