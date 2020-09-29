Feature: Template Instance
  Scenario: Using the Template Helper Modal to Add to My Collection
    Given I login and visit the Test Area
    When I create a template collection named "Test Template" using the first hot edge
    # this is the "Use Template" button
    Then I should see a 'CollectionCoverFormButton'

    When I click the 'CollectionCoverFormButton'
    Then I should see a 'templateHelperModal'

    When I choose to add the template instance into my collection from the template helper modal
    # it should route you directly to your instance
    Then I should see "-my-test-template" in the URL

  Scenario: Using the Template Helper Modal and the MDL snackbar
    Given I login and visit the Test Area
    # the template from the scenario above still exists, click "Use Template"
    When I click the 'CollectionCoverFormButton'
    And I choose to place the template instance elsewhere from the template helper modal
    Then I should see 'Test Template in transit' in a 'snackbar-message'

    When I place a card to the bottom using the snackbar
    And I wait for '@apiCreateTemplate' to finish
    Then I should see a collection card named "My Test Template"

    # navigating back to the master template
    When I navigate to the collection named "My Test Template" via the "CollectionCover"
    Then I should see a 'HeaderFormButton'

    When I click the 'HeaderFormButton'
    Then I should see "#template" in a ".SubduedHeading1"
