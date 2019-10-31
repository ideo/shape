Feature: Creating a Test Collection

  Scenario: Adding the test collection via the BCT
    Given I login and visit the Test Area
    When I create a test collection named "Test Prototype"
    Then I should see a collection card named "Test Prototype"
    When I navigate to the collection named "Test Prototype" via the "CollectionCover"
    And I wait for "@apiGetOrganizationAudiences" to finish
    Then I should see "Test Prototype" in a "EditableNameHeading"
    # verify existence of all three sections
    Then I should see "intro" in a "section-title"
    Then I should see "Idea(s)" in a "section-title"
    Then I should see "outro" in a "section-title"
    # verify the existence of the default questions
    Then I should see "Category Satisfaction" in a "QuestionSelectOption-category-satisfaction"
    Then I should see "Photo/Video" in a "QuestionSelectOption-photo-video"
    Then I should see "Description" in a "QuestionSelectOption-description"
    Then I should see "Clear" in a "QuestionSelectOption-clear"
    Then I should see "Exciting" in a "QuestionSelectOption-exciting"
    Then I should see "Useful" in a "QuestionSelectOption-useful"
    Then I should see 2 "QuestionSelectOption-open-response"
    Then I should see "Open Response" in a "QuestionSelectOption-open-response"
    Then I should see "End of Survey" in a ".DisplayText"

    # Scenario: Setting up the questions and launching the test
    When I enter "solutions{enter}" as my category
    When I add a link URL
    And I fill the 1st "QuestionContentEditorText" with "That's my fun concept"
    And I fill the 2nd "QuestionContentEditorText" with "What do you think?"
    And I fill the 3rd "QuestionContentEditorText" with "Would you buy it?"
    And I wait for "@apiUpdateItem" to finish
    And I add an open response question at position 8 with "Any questions or concerns?"
    And I click the "audienceCheckbox-share-via-link"
    # Share Via Link makes an API call to "open" when you check the checkbox
    And I wait for "@apiUpdateTestAudience" to finish
    When I click the "LaunchFormButton" containing "Get Feedback"
    And I wait for "@apiLaunchTest" to finish
    And I wait for "@apiGetCollectionCards" to finish

    Then I should see "Usefulness" in a "DataItemCover"
    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Test Prototype Feedback Design"
    Then I should see "Test Prototype" in a "LegendItemCover"
    Then I should see "CypressTest Organization" in a "LegendItemCover"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    When I navigate to the collection named "Test Prototype Feedback Design" via the "CollectionCover"

  Scenario: Filling out a test
    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    # this is used in the "visit current Test URL" below
    When I capture the current URL
    Given I logout
    And I visit the current Test URL
    Then I should see a "StandaloneTestSurvey"
    Then I should see a question with "question-welcome" and 1 emojis
    When I click the last "WelcomeQuestionEmojiButton"
    Then I should see a question with "question-terms" and 2 emojis
    When I accept the feedback survey terms
    Then I should see a question with "question-how-satisfied-are-you-with-your-current" and 4 emojis
    When I click the last "ScaleEmojiBtn"
    Then I should see "Why Coding Needs" in a "GridCard"
    Then I should see a question with "question-how-clear-is-this-idea-for-you" and 4 emojis
    When I click the last "ScaleEmojiBtn"
    Then I should see "ScaleEmojiBtn" deselected
    Then I should see a question with "question-how-exciting-is-this-idea-for-you" and 4 emojis
    When I click the last "ScaleEmojiBtn"
    Then I should see a question with "question-how-useful-is-this-idea-for-you" and 4 emojis
    When I click the last "ScaleEmojiBtn"
    Then I should see "What do you think?" in a "question-what-do-you-think"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    Then I should see "Would you buy it?" in a "question-would-you-buy-it"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    Then I should see "Any questions or concerns?" in a "question-any-questions-or-concerns"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    Then I should see a question with "question-finish" and 1 emojis
    Then I should see a "FinishedEmojiHolder"
    Then I should see a question with "question-recontact" and 2 emojis
    When I click "RecontactEmojiBtnThumbUp"
    Then I should see a "RecontactTextInput"
    When I add a test email for "RecontactTextInput"
    And I click the "RecontactTextResponseButton"
    And I wait for "@apiCreateLimitedUser" to finish
    Then I should see a "PostOptInEmojiHolder"
