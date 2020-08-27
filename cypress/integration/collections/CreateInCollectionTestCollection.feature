Feature: Creating an "in-collection" Test Collection

  Scenario: Creating an in-collection test
    Given I login and visit the Test Area
    When I create a test collection named "Cypress Test" using the first hot edge
    Then I should see a collection card named "Cypress Test"
    When I navigate to the collection named "Cypress Test" via the "CollectionCover"
    # the extra cards load for ideas collection
    And I wait for "@apiGetCollectionCards" to finish
    And I wait for "@apiGetOrganizationAudiences" to finish
    Then I should see "Cypress Test" in a "EditableNameHeading-recordName"
    When I click the "Radio-collection"
    And I wait for "@apiUpdateCollection" to finish
    And I wait for "@apiGetCollectionCards" to finish

    # should not have the sections
    Then I should see "Feedback Design" in a ".Heading3"
    Then I should see "Clear" in a "QuestionSelectOption-clear"
    Then I should see "Exciting" in a "QuestionSelectOption-exciting"
    Then I should see "Useful" in a "QuestionSelectOption-useful"
    Then I should see "Open Response" in a "QuestionSelectOption-open-response"
    Then I should see "End of Survey" in a ".DisplayText"

    # Setting up the open response question
    And I wait for 1 second
    And I fill the last "QuestionContentEditorText" with "What do you think?"
    And I wait for "@apiUpdateItem" to finish

    # Launch the test
    When I click the "LaunchFormButton" containing "Get Feedback"
    And I wait for "@apiValidateLaunch" to finish
    And I wait for "@apiLaunchTest" to finish

    # Now you are in the Test Results
    And I wait for "@apiGetCollectionCards" to finish
    And I wait for "@apiGetCollection" to finish
    # should technically be 3 calls to dataset but CI didn't like that
    And I wait for "@apiGetItemDataset" to finish
    # should only generate 3 graphs; category satisfaction was hidden
    Then I should see 3 "DataItemCover"
    Then I should see "Clarity" in a "DataItemCover"
    Then I should see "Excitement" in a "DataItemCover"
    Then I should see "Usefulness" in a "DataItemCover"
    Then I should see "Cypress Test" in a "LegendItemCover"
    Then I should see a collection card named "All Responses"
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

    # ----- Filling out the test -----

    # steps are similar to CreateTestCollection
    Then I should see a question with "question-welcome" and 1 emojis
    When I click the last "WelcomeQuestionEmojiButton"
    Then I should see a question with "question-how-clear-is-this-idea-for-you" and 4 emojis
    When I click the last answerable emoji
    Then I should see "ScaleEmojiBtn" deselected
    Then I should see a question with "question-how-exciting-is-this-idea-for-you" and 4 emojis
    When I click the last answerable emoji
    Then I should see a question with "question-how-useful-is-this-idea-for-you" and 4 emojis
    When I click the last answerable emoji
    Then I should see "What do you think?" in a "question-what-do-you-think"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    And I wait for 1 second
    Then I should see a question with "question-finish" and 1 emojis
