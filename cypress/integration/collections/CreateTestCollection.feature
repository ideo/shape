Feature: Creating a Test Collection

  Scenario: Adding the test collection via the BCT
    Given I login and visit the Test Area
    When I create a test collection named "Test Prototype"
    Then I should see a collection card named "Test Prototype"
    When I navigate to the collection named "Test Prototype" via the "CollectionCover"
    Then I should see "Test Prototype" in a "EditableNameHeading"
    # verify the existence of the default questions
    Then I should see "Photo or Video of Idea" in a "QuestionSelectOption"
    Then I should see "Idea Description" in a "QuestionSelectOption"
    Then I should see "Useful" in a "QuestionSelectOption"
    Then I should see "End of Survey" in a ".DisplayText"

    # Scenario: Setting up the questions and launching the test
    When I add a video
    And I add a test description
    And I add an open response question
    When I click the "HeaderFormButton" containing "Get Feedback"
    And I wait for "@apiLaunchTest" to finish
    And I wait for 1 second

    Then I should see "Usefulness" in a "ChartItemCover"
    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Test Prototype Feedback Design"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    When I capture the current URL
    And I visit the current Test URL
    Then I should see a "StandaloneTestSurvey"
