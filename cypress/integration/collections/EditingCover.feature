Feature: Editing Cover
  Scenario: Opening the CardCoverEditor to edit the title and subtitle
    Given I login and visit My Collection
    When I click the edit collection settings icon
    Then I should see a 'EditCoverOptions'
    # this should get the cover font color picker (since it's first)
    And I click the "QuickOption-font color"
    And I click the "#E27300" font color option
    And I type "Title" in the title textarea
    And I type "Subtitle" in the subtitle textarea
    And I click the 'ModalClose'
    And I wait for "@apiUpdateCollection" to finish
    Then I should see a collection card title "Title" with a subtitle "Subtitle" and color "#E27300"

    When I click the edit collection settings icon
    Then I should see a 'EditCoverOptions'
    And I click the "input" located in ".checkbox-hide-subtitle"
    And I click the 'ModalClose'
    Then I should not see a collection card with subtitle "Subtitle"
