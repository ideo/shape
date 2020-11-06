Feature: Data Item

  Scenario: Creating and modifying a data item
    Given I login and visit the Test Area
    When I create a normal collection named "Test data items" using the first hot edge
    And I navigate to the collection named "Test data items" via the "CollectionCover"
    And I create a data card
    Then I should see a "DataItemCover" in the card at 0,0
    Then I should see 1 for the single data value

    When I select "viewers" on the "measure" select on the report item
    And I wait for "@apiUpdateDataset" to finish
    Then I should see 16 for the single data value

    When I click the "EditableButton"
    And I select "month" on the "timeframe" select on the report item
    And I wait for "@apiUpdateDataset" to finish
    Then I should see an svg on the report item

    When I click the ".editableMetric StyledFilterIcon"
    And I enter "CypressTest" into group search
    And I wait for "@apiUpdateDataset" to finish
    Then I should see "from CypressTest" in a ".StyledGroupControlWrapper"
