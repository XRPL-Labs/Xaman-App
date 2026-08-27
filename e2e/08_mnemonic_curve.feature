Feature: Mnemonic curve import on Xahau testnet
    # Isolated checks for the sample 24-word mnemonic used in __DEV__ + developer
    # mode. Both derived accounts are activated on Xahau Testnet. Scenarios type
    # the 24 words (they do not rely on the debug prefill) and stop on the
    # confirm-address screen so the accounts are not imported twice.

    Background:
        Then I leave account import if open

    Scenario: Switch to Xahau testnet
        Then I tap 'tab-Home'
        Then I tap 'network-switch-button'
        Given I should have 'switch-network-overlay'
        Then I tap 'network-XAHAUTESTNET'

    Scenario: Curve chooser is available
        Then I open the mnemonic import screen
        Then I tap '12-words-button'
        Then I reveal mnemonic import options
        Then I tap 'choose-curve-switch'
        Given I should see 'curve-secp256k1-button'
        Given I should see 'curve-ed25519-button'

    Scenario: Import sample mnemonic as secp256k1
        Then I open the mnemonic import screen
        Then I tap '12-words-button'
        Then I reveal mnemonic import options
        Then I tap 'choose-curve-switch'
        Then I choose mnemonic curve "secp256k1"
        Then I tap '24-words-button'
        Then I use the sample 24-word mnemonic
        Then I enter my mnemonic
        Then I remember mnemonic address for curve "secp256k1"
        Then I tap 'next-button'
        Then I should confirm expected mnemonic address

    Scenario: Import sample mnemonic as ed25519
        Then I open the mnemonic import screen
        Then I tap '12-words-button'
        Then I reveal mnemonic import options
        Then I tap 'choose-curve-switch'
        Then I choose mnemonic curve "ed25519"
        Then I tap '24-words-button'
        Then I use the sample 24-word mnemonic
        Then I enter my mnemonic
        Then I remember mnemonic address for curve "ed25519"
        Then I tap 'next-button'
        Then I should confirm expected mnemonic address

    Scenario: Autodetect prompts when both curves are activated
        Then I open the mnemonic import screen
        Then I tap '24-words-button'
        Then I use the sample 24-word mnemonic
        Then I enter my mnemonic
        Then I remember mnemonic address for curve "secp256k1"
        Then I tap 'next-button'
        Then I should see both mnemonic curves activated prompt
        Then I tap alert button with label "secp256k1 r9w2Rv…"
        Then I should confirm expected mnemonic address
