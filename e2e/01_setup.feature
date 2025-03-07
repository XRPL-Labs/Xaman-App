Feature: Setup App
    Scenario: Show onboarding
        Given I should have 'onboarding-screen'
        Given I should see 'start-button'
        Then I tap 'start-button'

    Scenario: Setup passcode
        Given I should have 'setup-passcode-screen'
        Given I should see 'pin-code-explanation-view'
        Then I tap 'go-button'
        Given I should see 'pin-code-entry-view'
        Then I type my passcode
#        Then I tap alert button with label 'Use anyway'
        Then I type my passcode
#        Then I tap 'next-button'

    Scenario: Finish setup
        Given I should wait 4 sec to see 'agreement-setup-screen'
        Then I wait 4 sec for button 'confirm-button' to be enabled
        Then I tap 'confirm-button'

    Scenario: After setup
#        Given I should see 'change-log-overlay'
#        Then I tap 'close-change-log-button'
        Given I should see 'home-tab-empty-view'

    Scenario: Enabled developer mode
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'advanced-button'
        Given I should have 'advanced-settings-screen'
        Then I tap 'developer-mode-switch'
        Then I tap 'developer-mode-alert-continue-button'
        Then I type my passcode
        Then I tap 'back-button'
        Given I should have 'settings-tab-screen'
        Then I tap 'tab-Home'
        Given I should see 'home-tab-empty-view'
