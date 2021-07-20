Feature: Import Account
    # Secret Numbers
    Scenario: Import account with secret numbers with passcode as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-import-button'
        Given I should see 'account-import-access-level-view'
        Then I tap 'next-button'
        Given I should have 'account-import-secret-type-view'
        Then I tap 'next-button'
        Then I generate new secret number
        Then I enter my secret number
        Then I tap 'next-button'
        Given I should have 'account-import-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-import-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'I-SN-Passcode' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Activate Account
        Given I should see 'not-activated-account-container'
        Then I activate the account
        Then I should wait 20 sec to see 'assets-empty-view'
        Given I should see '80' in 'account-balance-label'

    Scenario: Test signing by adding a asset
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

    # Family Seed
    Scenario: Import account with family seed with passcode as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-import-button'
        Given I should see 'account-import-access-level-view'
        Then I tap 'next-button'
        Given I should have 'account-import-secret-type-view'
        Then I tap 'family-seed-radio-button'
        Then I tap 'next-button'
        Then I generate new family seed
        Then I enter my seed in the input
        Then I tap 'next-button'
        Given I should have 'account-import-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-import-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'I-FS-Passcode' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Activate Account
        Given I should see 'not-activated-account-container'
        Then I activate the account
        Then I should wait 20 sec to see 'assets-empty-view'
        Given I should see '80' in 'account-balance-label'

    Scenario: Test signing by adding a asset
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

    # Mnemonic
    Scenario: Import account with mnemonic with passcode as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-import-button'
        Given I should see 'account-import-access-level-view'
        Then I tap 'next-button'
        Given I should have 'account-import-secret-type-view'
        Then I tap 'mnemonic-radio-button'
        Then I tap 'next-button'
        Given I should have 'account-import-mnemonic-alert-view'
        Then I tap 'next-button'
        Given I should have 'account-import-enter-mnemonic-view'
        Then I tap '24-words-button'
        Then I generate new mnemonic
        Then I enter my mnemonic
        Then I tap 'next-button'
        Given I should have 'account-import-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-import-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'I-MN-Passcode' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Activate Account
        Given I should see 'not-activated-account-container'
        Then I activate the account
        Then I should wait 20 sec to see 'assets-empty-view'
        Given I should see '80' in 'account-balance-label'

    Scenario: Test signing by adding a asset
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


    # Family Seed + passphrase
    Scenario: Import account with family seed with passphrase as security
        Then I tap 'tab-Settings'
        Given I should have 'settings-tab-screen'
        Then I tap 'accounts-button'
        Given I should have 'accounts-list-screen'
        Then I tap 'add-account-button'
        Given I should see 'account-add-screen'
        Then I tap 'account-import-button'
        Given I should see 'account-import-access-level-view'
        Then I tap 'next-button'
        Given I should have 'account-import-secret-type-view'
        Then I tap 'family-seed-radio-button'
        Then I tap 'next-button'
        Then I generate new family seed
        Then I enter my seed in the input
        Then I tap 'next-button'
        Given I should have 'account-import-show-address-view'
        Then I read my account address
        Then I tap 'next-button'
        Given I should have 'account-import-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'passphrase-radio-button'
        Then I tap 'next-button'
        Given I should have 'account-import-passphrase-view'
        Then I enter my passphrase in 'passphrase-input'
        Then I enter my passphrase in 'passphrase-confirm-input'
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'I-FS-Passphrase' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
        Given I should see same account address

    Scenario: Activate Account
        Given I should see 'not-activated-account-container'
        Then I activate the account
        Then I should wait 20 sec to see 'assets-empty-view'
        Given I should see '80' in 'account-balance-label'

    Scenario: Test signing by adding a asset
        Then I tap 'add-asset-button'
        Given I should have 'add-asset-overlay'
        Given I should wait 10 sec to see 'add-and-sign-button'
        Then I tap 'add-and-sign-button'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I slide right 'accept-button'
        Then I enter my passphrase in 'passphrase-input'
        Then I tap 'sign-button'
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'success-result-view'
        Then I tap 'close-button'
        Given I should not have 'assets-empty-view'
