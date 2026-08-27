Feature: Transaction template deeplink
    # Templates are hex encoded transaction JSON (docs "simple-link-qr").
    # At this point in the suite the app is connected to Xahau Testnet (NetworkID 21338).

    Scenario: Sign a TrustSet transaction template deeplink
        # TrustSet GBP/rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq, NetworkID 21338 (connected network)
        Then I open the url 'https://xaman.app/detect/7B225472616E73616374696F6E54797065223A225472757374536574222C224C696D6974416D6F756E74223A7B2263757272656E6379223A22474250222C22697373756572223A22726875623856524E353573393471574B4476366A6D4479317055796B4A7A46337771222C2276616C7565223A2231303030303030227D2C22466C616773223A3133313037322C224E6574776F726B4944223A32313333387D'
        Given I should have 'review-transaction-modal'
        Then I scroll up 'review-content-container'
        Given I should see 'accept-button'
        Then I slide right 'accept-button'
        Given I should have 'new-trust-line-alert-overlay'
        Then I tap 'continue-button'
        Then I type my passcode
        Given I should see 'submitting-view'
        Given I should wait 20 sec to see 'success-result-view'
        Then I tap 'close-button'
        Given I should have 'home-tab-view'

    Scenario: Reject a template declared for an unknown network
        # same TrustSet but NetworkID 999999 (not a known network)
        Then I open the url 'https://xaman.app/detect/7B225472616E73616374696F6E54797065223A225472757374536574222C224C696D6974416D6F756E74223A7B2263757272656E6379223A22474250222C22697373756572223A22726875623856524E353573393471574B4476366A6D4479317055796B4A7A46337771222C2276616C7565223A2231303030303030227D2C22466C616773223A3133313037322C224E6574776F726B4944223A3939393939397D'
        Given I should see alert with content 'This payload is not available on the network you are connected with'
        Then I tap alert button with label 'OK'

    Scenario: Reject a template without NetworkID while connected to a Xahau network
        # no NetworkID means the template targets XRPL networks and cannot be used on Xahau
        Then I open the url 'https://xaman.app/detect/7B225472616E73616374696F6E54797065223A225472757374536574222C224C696D6974416D6F756E74223A7B2263757272656E6379223A22474250222C22697373756572223A22726875623856524E353573393471574B4476366A6D4479317055796B4A7A46337771222C2276616C7565223A2231303030303030227D2C22466C616773223A3133313037327D'
        Given I should see alert with content 'This payload is not available on the network you are connected with'
        Then I tap alert button with label 'OK'

    Scenario: Offer network switch for a template declared for another known network
        # NetworkID 21337 (Xahau mainnet) while connected to Xahau Testnet: review opens and preflight asks to switch
        Then I open the url 'https://xaman.app/detect/7B225472616E73616374696F6E54797065223A225472757374536574222C224C696D6974416D6F756E74223A7B2263757272656E6379223A22474250222C22697373756572223A22726875623856524E353573393471574B4476366A6D4479317055796B4A7A46337771222C2276616C7565223A2231303030303030227D2C22466C616773223A3133313037322C224E6574776F726B4944223A32313333377D'
        Given I should see 'preflight-error-view'
        Then I tap 'close-button'
        Given I should have 'home-tab-view'

    Scenario: Reject a non-TrustSet transaction template
        # Payment template, NetworkID 21338: only TrustSet templates are supported
        Then I open the url 'https://xaman.app/detect/7B225472616E73616374696F6E54797065223A225061796D656E74222C2244657374696E6174696F6E223A22726875623856524E353573393471574B4476366A6D4479317055796B4A7A46337771222C22416D6F756E74223A2231303030303030222C224E6574776F726B4944223A32313333387D'
        Given I should see alert with content "This QR code doesn't contain information we would expect!"
        Then I tap alert button with label 'OK'
