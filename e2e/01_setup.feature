Feature: Setup App
    Scenario: Show onboarding
        Given I should have 'onboarding-screen'
        Given I should see 'slider-start-button'
        Then I tap 'slider-start-button'

    Scenario: Setup passcode
        Given I should have 'setup-passcode-screen'
        Given I should see 'pin-code-explanation-view'
        Then I tap 'go-button'
        Given I should see 'pin-code-entry-view'
        Then I type my passcode
        Then I tap 'next-button'
        Then I type my passcode
        Then I tap 'next-button'

    Scenario: Finish setup
        Given I should wait 5 sec to see 'agreement-setup-screen'
        Then I tap 'confirm-button'

    Scenario: After setup
        Given I should see 'change-log-overlay'
        Then I tap 'close-change-log-button'
        Given I should see 'home-tab-empty-view'







