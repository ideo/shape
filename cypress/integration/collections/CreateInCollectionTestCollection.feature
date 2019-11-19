Feature: Creating an "in-collection" Test Collection

  Scenario: Adding and launching an in-collection test
    Given I login and visit the Test Area
    When I create a test collection named "Cypress Test"
    Then I should see a collection card named "Cypress Test"
    When I navigate to the collection named "Cypress Test" via the "CollectionCover"
    Then I should see "Cypress Test" in a "EditableNameHeading"
    When I click the "Radio-collection"
    And I wait for "@apiUpdateCollection" to finish
    And I wait for "@apiGetCollectionCards" to finish

    # verify existence of all three sections
    # TODO: in-collection tests will eventually not have these same sections
    Then I should see "intro" in a "section-title"
    Then I should see "Idea(s)" in a "section-title"
    Then I should see "outro" in a "section-title"
    Then I should see 1 "QuestionSelectOption-useful"
    Then I should see "Useful" in a "QuestionSelectOption-useful"
    Then I should see "End of Survey" in a ".DisplayText"

    # Setting up the questions and launching the test
    # (similar to CreateTestCollection)
    When I enter "solutions{enter}" as my category
    And I fill the 1st "QuestionContentEditorText" with "Space Elevator"
    And I fill the 2nd "QuestionContentEditorText" with "Take this elevator to the stratosphere"
    When I add a link URL
    And I wait for "@apiUpdateItem" to finish
    # 3rd and 4th are after the first 2 content editors inside the Idea
    And I fill the 3rd "QuestionContentEditorText" with "What do you think?"
    And I fill the 4th "QuestionContentEditorText" with "Would you buy it?"

    # Launch the test
    When I click the "LaunchFormButton" containing "Get Feedback"
    And I wait for "@apiLaunchTest" to finish
    And I wait for "@apiGetCollectionCards" to finish
    Then I should see "Category Satisfaction" in a "DataItemCover"
    Then I should see "Clarity" in a "DataItemCover"
    Then I should see "Excitement" in a "DataItemCover"
    Then I should see "Usefulness" in a "DataItemCover"
    Then I should see "Cypress Test" in a "LegendItemCover"

    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Cypress Test Feedback Design"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    When I navigate to the collection named "Cypress Test Feedback Design" via the "CollectionCover"
    # For some reason the await API response is not actually awaiting here, so the 1 second delay is needed
    And I wait for 1 second

    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    # this is used in the "visit current Test URL" below
    When I capture the current URL
    And I visit the current Test URL
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetTestCollection" to finish
    And I wait for 1 second
    Then I should see a "ActivityLogSurveyResponder"

    # starting to fill it out (otherwise repetitive of CreateTestCollection)
    Then I should see a question with "question-welcome" and 1 emojis
    When I click the last "WelcomeQuestionEmojiButton"
    Then I should see a question with "question-how-satisfied-are-you-with-your-current" and 4 emojis
