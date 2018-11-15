Feature: Search

  Scenario: Searching for various things
    Given I login and visit the Test Area

    And I search for the "Does not exist" collection
    Then I should see the no global search resuls for "Does not exist"

    When I clear the search results
    And I search for the "Inner" collection
    Then I should see the "Inner" collection in the global search results

    When I clear the search results
    And I search for "" within the current page
    Then I should see 2 search results
    Then I should see the "Inner" collection in the global search results

    When I clear the search results
    And I search for "Inner" within the current page
    Then I should see 2 search results
