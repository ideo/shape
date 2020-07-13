Feature: Creating a Test Collection

  Scenario: Adding the test collection via the BCT
    Given I login and visit the Test Area
    When I create a test collection named "Test Prototype"
    Then I should see a collection card named "Test Prototype"
    When I navigate to the collection named "Test Prototype" via the "CollectionCover"
    # the extra cards load for ideas collection
    And I wait for "@apiGetCollectionCards" to finish
    And I wait for "@apiGetOrganizationAudiences" to finish
    Then I should see "Test Prototype" in a "EditableNameHeading-recordName"
    # verify existence of all three sections
    Then I should see "intro" in a "section-title"
    Then I should see "Idea(s)" in a "section-title"
    Then I should see "outro" in a "section-title"
    # verify the existence of the default questions
    Then I should see "Category Satisfaction" in a "QuestionSelectOption-category-satisfaction"
    Then I should see "Idea" in a ".IdeaLabel"
    Then I should see "1/1" in a "num-ideas"
    Then I should see "Clear" in a "QuestionSelectOption-clear"
    Then I should see "Exciting" in a "QuestionSelectOption-exciting"
    Then I should see "Useful" in a "QuestionSelectOption-useful"
    Then I should see 2 "QuestionSelectOption-open-response"
    Then I should see "Open Response" in a "QuestionSelectOption-open-response"
    Then I should see "End of Survey" in a ".DisplayText"

    # Setting up the questions and launching the test
    When I enter "solutions{enter}" as my category
    And I fill the 1st "QuestionContentEditorText" with "Space Elevator Idea"
    And I fill the 2nd "QuestionContentEditorText" with "Take this elevator to the stratosphere"
    When I add a link URL
    And I wait for "@apiUpdateItem" to finish

    # Add another idea
    When I click the "add-new-idea"
    Then I should see "2/2" in a "num-ideas"
    And I fill the 1st "QuestionContentEditorText" with "Space Escalator Idea"
    And I fill the 2nd "QuestionContentEditorText" with "Slowly ride up into the stratosphere"
    When I add a link URL
    And I wait for "@apiUpdateItem" to finish

    # Toggling show media
    When I click the "test-show-media-checkbox"
    Then I should not see a ".StyledLinkCover"
    When I click the "test-show-media-checkbox"
    Then I should see a ".StyledLinkCover"

    # 3rd and 4th are after the first 2 content editors inside the Idea
    And I fill the 3rd "QuestionContentEditorText" with "What do you think?"
    And I fill the 4th "QuestionContentEditorText" with "Would you buy it?"
    # add an additional question to test the form
    And I add an open response question with "Any questions or concerns?"
    And I click the "audienceCheckbox-share-via-link"
    # Share Via Link makes an API call to "open" when you check the checkbox
    And I wait for "@apiToggleAudienceStatus" to finish
    When I click the "LaunchFormButton" containing "Get Feedback"

    # NOTE: seemingly no way to test clipboard copying in cypress (i.e. "Get Link")
    # this is used in the "visit current Test URL" below; capture before redirect to results
    When I capture the current URL

    # just add some padding to how long it waits for things to finish
    And I wait for 2 seconds
    And I wait for "@apiValidateLaunch" to finish
    And I wait for "@apiLaunchTest" to finish
    And I wait for "@apiGetCollectionCards" to finish
    # for some reason CI wouldn't wait for the 3rd... ?
    And I wait for 2 calls to "@apiGetItemDataset" to finish
    Then I should see "Usefulness" in a "DataItemCover"

    # need to scroll down to load more cards on the board
    And I scroll down by 1800 pixels
    # loading extra cards + open response collections
    And I wait for 3 calls to "@apiGetCollectionCards" to finish
    When I wait for 3 seconds

    Then I should see a collection card named "Test Prototype Feedback Design"
    Then I should see "Test Prototype" in a "LegendItemCover"
    Then I should see "CypressTest Organization" in a "LegendItemCover"
    Then I should see "Get Link" in a "HeaderFormButton"
    Then I should see "Stop Feedback" in a "HeaderFormButton"

    # ----- Filling out the test -----

    Given I logout
    And I visit the current Test URL
    Then I should see a "StandaloneTestSurvey"
    Then I should see a question with "question-welcome" and 1 emojis
    When I click the last "WelcomeQuestionEmojiButton"
    Then I should see a question with "question-terms" and 2 emojis
    When I accept the feedback survey terms
    Then I should see a question with "question-how-satisfied-are-you-with-your-current" and 4 emojis
    When I click the last answerable emoji

    # --- Idea 1 ---
    # ideas are randomized so we just search for 1 GridCard which represents the first idea / media
    Then I should see 1 "GridCard"
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
    # has to wait for flipmove delay?
    And I wait for 1 second
    # --- Idea 2 ---
    Then I should see 2 "GridCard"
    # "8 emojis" is one way to match "we'll see 2 of these questions with 4 emojis each"
    Then I should see a question with "question-how-clear-is-this-idea-for-you" and 8 emojis
    When I click the last answerable emoji
    Then I should see a question with "question-how-exciting-is-this-idea-for-you" and 8 emojis
    When I click the last answerable emoji
    Then I should see a question with "question-how-useful-is-this-idea-for-you" and 8 emojis
    When I click the last answerable emoji
    Then I should see "What do you think?" in a "question-what-do-you-think"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    # --- end ideas

    Then I should see "Would you buy it?" in a "question-would-you-buy-it"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    Then I should see "Any questions or concerns?" in a "question-any-questions-or-concerns"
    When I fill the last "OpenQuestionTextInput" with some text
    And I click the last "OpenQuestionTextButton"
    And I wait for "@apiCreateQuestionAnswer" to finish
    And I wait for 1 second
    Then I should see a question with "question-finish" and 1 emojis
    Then I should see a "FinishedEmojiHolder"
    Then I should see a question with "question-recontact" and 2 emojis
    When I click the "RecontactEmojiBtnThumbUp"
    Then I should see a "RecontactTextInput"
    When I add a test email for "RecontactTextInput"
    And I click the "RecontactTextResponseButton"
    And I wait for "@apiCreateLimitedUser" to finish
    Then I should see a "PostOptInEmojiHolder"
