Feature: Creating a Test Collection

  Scenario: Adding the test collection via the BCT
    Given I login and visit the Test Area
    When I create a "test" collection named "Feedback Prototype"
    Then I should see a collection card named "Feedback Prototype"
    When I navigate to the collection named "Feedback Prototype" via the "CollectionCover"
    Then I should see "Feedback Prototype" in a "EditableNameHeading"
    # verify the existence of the default questions
    Then I should see "Photo or Video of Idea" in a "QuestionSelectOption"
    Then I should see "Idea Description" in a "QuestionSelectOption"
    Then I should see "Useful" in a "QuestionSelectOption"
    Then I should see "End of Survey" in a "DisplayText" styled component

    # Scenario: Setting up the questions and launching the test
    When I add a video
    And I add a test description
    And I add an open response question
    When I click the "HeaderFormButton" containing "Get Feedback"
    Then I should see "Are you sure?" in a "ConfirmPrompt"

    When I click the "ConfirmButton" containing "Launch"
    And I wait for "@apiLaunchTest" to finish
    # assuming the collection cover is not truncated...
    Then I should see a collection card named "Feedback Prototype Test Design"
