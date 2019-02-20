Feature: Data Item

  Scenario: Creating and modifying a data item
    Given I login and visit the Test Area

    And I create a data item
    Then I should see a "DataItemCover" in the first card
