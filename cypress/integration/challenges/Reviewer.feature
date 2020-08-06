Feature: Challenge reviewer setup
  Scenario: Adding reviewers to a Challenge in List View
    Given I login and create an automated challenge
    Then I should see a collection card named "Challenge Submissions"

    When I navigate to the collection named "Challenge Submissions" via the "CollectionCover"
    # also wait to retrieve the Phases and Submissions collection
    And I wait for "@apiGetChallengePhaseCollections" to finish
    And I wait for "@apiGetCollection" to finish
    And I wait for "@apiGetCollectionCards" to finish
    # now the submissions should be loaded
    And I click the "ListViewToggle"
    And I click the "RolesAdd"
    And I click on the first checkbox
    And I escape
    Then I should see ".avatar" element in a "ListCardRow"
