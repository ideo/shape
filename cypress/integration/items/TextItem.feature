Feature: Text Item

  Scenario: Creating and modifying a text item
    Given I login and visit the Test Area

    And I create a text item
    And I type some random things
    Then I should see a "TextItemCover" in the first card
