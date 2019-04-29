Feature: Creating a Public Collection

  Scenario: Making a collection viewable by anyone
    Given I login and visit the Test Area
    When I create a normal collection named "Anyone Can See"
    When I navigate to the collection named "Anyone Can See" via the "CollectionCover"
    Then I should see "Anyone Can See" in a "EditableNameHeading"

    When I click ... in the nav and select "permissions"
    Then I should see the "Sharing: Anyone Can See" modal

    When I click the "Allow anyone with this link to view (OFF)"
    Then I should see a "Allow anyone with this link to view (ON)"
    Then I should see a "Get Link"
