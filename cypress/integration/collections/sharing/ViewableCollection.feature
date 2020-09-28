Feature: Sharing a Collection

  Scenario: Making a collection viewable by anyone
    Given I login and visit the Test Area
    When I create a normal collection named "Anyone Can See" using the first hot edge
    When I navigate to the collection named "Anyone Can See" via the "CollectionCover"
    Then I should see "Anyone Can See" in a "EditableNameHeading-recordName"

    When I click ... in the nav and select "sharing"
    Then I should see the "Sharing: Anyone Can See" modal

    When I click the "public-sharing-options-title"
    And I click the "anyone-can-view-checkbox"
    Then I should see the "Confirmation" modal

    When I click the "ConfirmButton"
    Then I should see "Allow anyone with this link to view (ON)" in a "anyone-can-view-checkbox"

    When I click the "anyone-can-view-link"
    Then I should have an element named ".StyledSnackbarText"

    When I capture the current URL
    And I clear all cookies
    And I visit the captured URL
    Then I should see "Anyone Can See" in a "EditableNameHeading-recordName"
