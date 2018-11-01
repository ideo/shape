Feature: Visiting the Marketing Page

  Scenario: Non-logged in visitors should see the Marketing Page
    Given I visit the Marketing Page
    Then I should see a ".MarketingShapeLogo"
