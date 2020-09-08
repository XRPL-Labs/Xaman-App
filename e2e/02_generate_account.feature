Feature: Generate Account
    Scenario: Generate account with passcode as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-generate-button'
        Given I should see 'account-generate-explanation-private-view'
        Then I tap 'next-button'
        Given I should see 'account-generate-show-private-view'
        Then I write down secret numbers
        Then I tap 'next-button'
        Given I should have 'account-generate-confirm-private-view'
        # Then I enter my secret number
        Then I tap 'next-button'
        Given I should have 'account-generate-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-generate-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-generate-security-view'
        Then I tap 'next-button'
        Given I should have 'account-generate-label-view'
        Then I enter 'G-Passcode-1' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-generate-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Activate Account
        Given I should see 'not-activated-account-container'
        Then I activate the account
        Given I should wait 20 sec to see 'activated-account-container'
        Given I should see '80' in 'account-balance-label'
        Given I should have 'assets-empty-view'

    Scenario: Test signing by adding a asset
        Then I tap 'add-asset-button'
        Given I should have 'add-asset-overlay'
        Then I tap 'add-and-sign-button'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I tap 'accept-button'
        Then I type my passcode
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'result-view'
        Given I should see 'tesSUCCESS' in 'engine-result-text'
        Then I tap 'close-button'
        Given I should have 'assets-scroll-view'


    Scenario: Generate account with passphrase as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-generate-button'
        Given I should see 'account-generate-explanation-private-view'
        Then I tap 'next-button'
        Given I should see 'account-generate-show-private-view'
        Then I write down secret numbers
        Then I tap 'next-button'
        Given I should have 'account-generate-confirm-private-view'
        # Then I enter my secret number
        Then I tap 'next-button'
        Given I should have 'account-generate-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-generate-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-generate-security-view'
        Then I tap 'passphrase-radio-button'
        Then I tap 'next-button'
        Given I should have 'account-generate-passphrase-view'
        Then I enter my passphrase in 'passphrase-input'
        Then I enter my passphrase in 'passphrase-confirm-input'
        Then I tap 'next-button'
        Given I should have 'account-generate-label-view'
        Then I enter 'G-Passphrase-2' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-generate-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address
        Given I should see 'not-activated-account-container'

    Scenario: Activate Account
        Then I activate the account
        Given I should wait 20 sec to see 'activated-account-container'
        Given I should see '80' in 'account-balance-label'
        Given I should have 'assets-empty-view'

    Scenario: Test signing by adding a asset
        Then I tap 'add-asset-button'
        Given I should have 'add-asset-overlay'
        Then I tap 'add-and-sign-button'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I tap 'accept-button'
        Then I enter my passphrase in 'passphrase-input'
        Then I tap 'sign-button'
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'result-view'
        Given I should see 'tesSUCCESS' in 'engine-result-text'
        Then I tap 'close-button'
        Given I should have 'assets-scroll-view'