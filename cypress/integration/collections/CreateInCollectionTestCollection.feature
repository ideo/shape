Feature: Creating an "in-collection" Test Collection

  Scenario: Adding and launching an in-collection test
    Given I login and visit the Test Area
    When I create a test collection named "Cypress Test"
    Then I should see a collection card named "Cypress Test"
    When I navigate to the collection named "Cypress Test" via the "CollectionCover"
    Then I should see "Cypress Test" in a "EditableNameHeading"
    When I click the "Radio-collection"
    And I wait for '@apiArchiveCollectionCards' to finish
    And I wait for '@apiUpdateCollection' to finish
    Then I should see 1 "QuestionSelectOption"
    Then I should see "Useful" in a "QuestionSelectOption"
    Then I should see "End of Survey" in a ".DisplayText"

    # Launch the test
    When I click the "HeaderFormButton" containing "Get Feedback"
    And I wait for "@apiLaunchTest" to finish
    Then I should see "Usefulness" in a "ChartItemCover"

    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Cypress Test Feedback Design"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    When I capture the current URL
    And I visit the current Test URL
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetTestCollection" to finish
    Then I should see a "ActivityLogSurveyResponder"
