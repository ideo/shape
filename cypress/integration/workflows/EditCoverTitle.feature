Feature: Edit Card Title
  Scenario: Changing the title using the textarea
    Given I login and visit My Collection
    When I click the "CardAction-select cover image"
    Then I should see a 'EditCoverOptions'
    Given I type "New Title" in the textarea
    When I click the 'EditCoverCloseBtn'
    And I wait for "@apiUpdateCollection" to finish
    Then I should see a collection card named "New Title"
