Feature: Creating a Collection

  Scenario: Opening BCT to create a collection
    Given I login and visit the Test Area
    When I create a normal collection named "Hello World"
    Then I should see a collection card named "Hello World"
    When I navigate to the collection named "Hello World" via the "CollectionCover"
    Then I should see "Hello World" in a "EditableNameHeading-recordName"

    # Test navigating back to the parent collection via the breadcrumb
    # wait to make sure that the slug is in the URL
    When I wait for 1 second
    When I capture the current URL
    And I create a normal collection named "Another One" in my empty collection
    And I navigate to the collection named "Another One" via the "CollectionCover"
    Then I should see "Hello World" in a "Breadcrumb"
    When I navigate to the collection named "Hello World" via the breadcrumb
    Then the URL should match the captured URL

    # open the ActivityLog to see the CommentThread
    When I click the "ActivityLogButton"
    And I wait for "@apiGetCommentThread" to finish
    Then I should see "Hello World" in a "CommentThreadHeaderName"
