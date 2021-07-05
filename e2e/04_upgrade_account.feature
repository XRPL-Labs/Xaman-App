Feature: Upgrade Account
    Scenario: Import readonly account
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-import-button'
        Given I should see 'account-import-access-level-view'
        Then I tap 'readonly-radio-button'
        Then I tap 'next-button'
        Given I should see 'account-import-enter-address-view'
        Then I generate testnet account
        Then I enter the address in the input
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'I-ReadOnly' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Upgrade Account
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I scroll 'account-list-scroll' to bottom
        Then I tap my account in the list
        Given I should have 'account-settings-screen'
        Then I tap 'account-access-level-button'
        Given I should have 'picker-modal'
        Then I tap 'Full-item'
        Then I tap alert button with label "Yes, I'm sure"
        Given I should have 'account-import-secret-type-view'
        Then I tap 'family-seed-radio-button'
        Then I tap 'next-button'
        Given I should have 'account-import-enter-family-seed-view'
        Then I enter my seed in the input
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Given I should have 'settings-tab-screen'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address


    Scenario: Add a asset
        Then I tap 'add-asset-button'
        Given I should have 'add-asset-overlay'
        Given I should wait 10 sec to see 'add-and-sign-button'
        Then I tap 'add-and-sign-button'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I slide right 'accept-button'
        Then I type my passcode
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'success-result-view'
        Then I tap 'close-button'
        Given I should not have 'assets-empty-view'