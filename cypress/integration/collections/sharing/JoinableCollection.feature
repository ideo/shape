Feature: Sharing a Collection

  Scenario: Making a collection joinable by anyone
    Given I login and visit the Test Area
    When I create a normal collection named "Anyone Can See" using the first hot edge
    When I navigate to the collection named "Anyone Can See" via the "CollectionCover"
    Then I should see "Anyone Can See" in a "EditableNameHeading-recordName"

    When I click ... in the nav and select "sharing"
    Then I should see the "Sharing: Anyone Can See" modal

    When I click the "public-sharing-options-title"
    And I click the "anyone-can-join-checkbox"
    And I wait for "@apiUpdateCollection" to finish
    And I wait for "@apiGetGroup" to finish
    Then I should see "CypressTest Guests" in a "public-joinable-group-toggle"
