Feature: Data Item

  Scenario: Creating and modifying a data item
    Given I login and visit the Test Area
    And I create a normal collection named "Test data items"
    And I navigate to the collection named "Test data items" via the "CollectionCover"

    And I create a data card
    And I wait for "@apiCreateCollectionCard" to finish
    And I wait for "@apiGetItemDataset" to finish
    Then I should see a "DataItemCover" in the first card
    Then I should see 1 for the single data value

    When I select "viewers" on the "measure" select on the report item
    And I wait for "@apiUpdateDataset" to finish
    Then I should see 16 for the single data value

    When I click the "EditableButton"
    When I select "month" on the "timeframe" select on the report item
    And I wait for "@apiGetItemDataset" to finish
    Then I should see an svg on the report item

    When I click the ".editableMetric StyledFilterIcon"
    When I enter "CypressTest" into group search
    And I wait for "@apiUpdateDataset" to finish
    Then I should see "from CypressTest" in a ".StyledGroupControlWrapper"
