Feature: Family seed curve import on Xahau testnet
    # Isolated checks for family seed secp256k1 vs ed25519. Autodetect prompts
    # before switching to ed25519 when that account is activated and secp is
    # not. Earlier scenarios stop on the confirm-address screen. The last
    # scenario finishes import so the app is left on Home.

    Background:
        Then I leave account import if open

    Scenario: Switch to Xahau testnet
        Then I tap 'tab-Home'
        Then I tap 'network-switch-button'
        Given I should have 'switch-network-overlay'
        Then I tap 'network-XAHAUTESTNET'

    Scenario: Family seed curve picker is available
        Then I open the family seed import screen
        Then I generate new family seed
        Then I enter my seed in the input
        Given I should see 'keypair-curve-row'
        Given I should see family seed curve "secp256k1"

    Scenario: Family seed curve picker defaults to secp256k1
        Then I open the family seed import screen
        Then I generate new family seed
        Then I enter my seed in the input
        Then I remember family seed address for curve "secp256k1"
        Given I should see family seed curve "secp256k1"
        Then I tap 'next-button'
        Then I should confirm expected family seed address

    Scenario: Family seed curve picker can select ed25519
        Then I open the family seed import screen
        Then I generate new family seed
        Then I enter my seed in the input
        Then I remember family seed address for curve "ed25519"
        Given I should see family seed curve "secp256k1"
        Then I choose family seed curve "ed25519"
        Then I tap 'next-button'
        Then I should confirm expected family seed address

    Scenario: Entering another family seed resets the curve to secp256k1
        Then I open the family seed import screen
        Then I generate new family seed
        Then I enter my seed in the input
        Given I should see family seed curve "secp256k1"
        Then I choose family seed curve "ed25519"
        Given I should see family seed curve "ed25519"
        Then I generate new family seed
        Then I enter my seed in the input
        Given I should see family seed curve "secp256k1"

    Scenario: Autodetect prompts to use the activated ed25519 account
        Then I open the family seed import screen
        Then I use the xahau testnet ed25519 family seed
        Then I enter my seed in the input
        Then I should see the family seed different curve prompt
        Then I tap alert button with label "ed25519 rN1SEY…"
        Given I should see family seed curve "ed25519"
        Then I tap 'next-button'
        Then I should confirm expected family seed address

    Scenario: Autodetect prompt No keeps secp256k1
        Then I open the family seed import screen
        Then I use the xahau testnet ed25519 family seed
        Then I remember family seed address for curve "secp256k1"
        Then I enter my seed in the input
        Then I should see the family seed different curve prompt
        Then I tap alert button with label "secp256k1 rE1b4i…"
        Given I should see family seed curve "secp256k1"
        Then I tap 'next-button'
        Then I should confirm expected family seed address
        Then I tap 'next-button'
        Given I should see 'account-import-explain-activation-view'
        Then I tap 'next-button'
        Given I should have 'account-import-security-view'
        Then I tap 'next-button'
        Given I should have 'account-import-label-view'
        Then I enter 'E2E-FS-Secp' in 'label-input'
        Then I tap 'next-button'
        Given I should have 'account-import-finish-view'
        Then I tap 'finish-button'
        Then I tap 'tab-Home'
        Given I should have 'home-tab-view'
