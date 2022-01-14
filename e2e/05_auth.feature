Feature: Lock
    Scenario: Change lock timeout to zero
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'security-button'
        Given I should see 'security-settings-screen'
        Then I tap 'auto-lock-button'
        Given I should have 'picker-modal'
        Then I tap '0-item'
        Given I should see 'security-settings-screen'
        Then I tap 'back-button'
        Given I should have 'settings-tab-screen'
        Then I tap 'tab-Home'

    Scenario: Unlock the app after coming from background
        Then I send the app to the background
        Then I wait 20 sec and then bring the app to foreground
        Given I should have 'lock-overlay'
        Then I enter my passcode
        Given I should see 'home-tab-view'

    Scenario: Unlock the app after cold start
        Then I close the app
        Then I launch the app
        Given I should have 'lock-overlay'
        Then I enter my passcode
        Given I should see 'home-tab-view'


    Scenario: Change passcode
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'security-button'
        Given I should see 'security-settings-screen'
        Then I tap 'change-passcode-button'
        Given I should have 'change-passcode-screen'
        Then I type my passcode
        Then I type my new passcode
        Then I type my new passcode
        Then I tap alert button with label "OK"
        Given I should see 'security-settings-screen'
        Then I tap 'back-button'
        Given I should have 'settings-tab-screen'
        Then I tap 'tab-Home'

    Scenario: Add a asset for testing signing
        Then I tap 'add-asset-button'
        Given I should have 'add-asset-overlay'
        Then I tap 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B.BTC'
        Given I should wait 10 sec to see 'add-and-sign-button'
        Then I tap 'add-and-sign-button'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I slide right 'accept-button'
        Given I should wait 10 sec to see 'new-trust-line-alert-overlay'
        Then I tap 'continue-button'
        Then I type my passcode
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'success-result-view'
        Then I tap 'close-button'

    Scenario: Unlock the app after cold start
        Then I close the app
        Then I launch the app
        Given I should have 'lock-overlay'
        Then I enter my passcode
        Given I should see 'home-tab-view'

    Scenario: Change Lock Timeout To 1 Week
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'security-button'
        Given I should see 'security-settings-screen'
        Then I tap 'auto-lock-button'
        Given I should have 'picker-modal'
        Then I tap '10080-item'
        Given I should see 'security-settings-screen'
        Then I tap 'back-button'
        Given I should have 'settings-tab-screen'
        Then I tap 'tab-Home'

    Scenario: Coming from background should not lock the app
        Then I send the app to the background
        Then I wait 1 sec and then bring the app to foreground
        Given I should see 'home-tab-view'

    Scenario: Coming from cold start should not lock the app
        Then I close the app
        Then I launch the app
        Given I should see 'home-tab-view'




