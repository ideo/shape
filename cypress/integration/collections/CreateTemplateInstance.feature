Feature: Template Instance
  Scenario: Using the Template Helper Modal
    Given I login and visit the Test Area
    When I create a template card
    Then I should see a 'CollectionCoverFormButton'

    When I click the 'CollectionCoverFormButton'
    Then I should see a 'templateHelperModal'

    When I choose to add the template instance into my collection from the template helper modal
    And I wait for '@apiCreateTemplate' to finish
    Then I should have an element named ".StyledSnackbarText"

    When I click the 'CollectionCoverFormButton'
    And I choose to place the template instance elsewhere from the template helper modal
    Then I should see 'Test Template in transit' in a '.MuiSnackbarContent-message'

    When I place a card to the bottom using the snackbar
    And I wait for '@apiCreateTemplate' to finish
    Then I should see a collection card named "My Test Template"

    # navigating back to the master template
    When I navigate to the collection named "My Test Template" via the "CollectionCover"
    Then I should see a 'HeaderFormButton'

    When I click the 'HeaderFormButton'
    Then I should see "#template" in a ".SubduedHeading1"
