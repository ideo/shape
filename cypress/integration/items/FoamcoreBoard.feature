Feature: Foamcore Board

Scenario: Creating a foam core board from the BCT
  Given I login and visit the Test Area
  When I create a foamcoreBoard collection named "foamcoreBoard"
  Then I should see "foamcoreBoard" in a "GridCard"
