Feature: Visiting the Marketing Page

  Scenario: Logging out and viewing the Marketing Page
    # NOTE: Marketing page doesn't fully play well with Cypress since we disable firestore
    Given I logout and visit the Marketing Page
    Then I should see the element "MarketingShapeLogo"
