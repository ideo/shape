Feature: Visiting the Marketing Page

  Scenario: Non-logged in visitors should see the Marketing Page
    Given I visit the Marketing Page
    Then I should see a ".MarketingShapeLogo"

  Scenario: Logging out should land me on the Marketing Page
    Given I login and visit My Collection
    # NOTE: Marketing page doesn't fully render with Cypress since we disable firestore
    When I logout and visit the Marketing Page
    Then I should see a ".MarketingShapeLogo"
