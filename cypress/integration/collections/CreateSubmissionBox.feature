Feature: Submission Box

  Scenario: Creating Submission Box from the BCT and Submitting A Submission
    Given I login and visit the Test Area
    When I create a submissionBox collection named "Submit Your Ideas" using the first hot edge
    Then I should see "Submission Box Settings" in a "modal-title"
    When I choose a link item from the submission box
    Then I should see a ".SubmissionButton"
    When I click the ".SubmissionButton"
    And I add a link URL "https://www.shape.space" and wait for "@externalUrl"
    Then I should see a "GridCard"
