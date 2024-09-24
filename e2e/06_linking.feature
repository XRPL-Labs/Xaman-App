Feature: Linking
    Scenario: Open the tx blob link in foreground
        Then I open the url 'https://xumm.app/tx/1200032280000000240000003241833237B8665D2F4E00135E8DE646589F68400000000000000C732103709723A5967EAAED571B71DB511D87FA44CC7CDDF827A37F457A25E14D862BCD74473045022100C6A6999BD33153C6A236D78438D1BFEEEC810CFE05D0E41339B577560C9143CA022074F07881F559F56593FF680049C12FC3BCBB0B73CE02338651522891D95886F981146078086881F39B191D63B528D914FEA7F8CA2293F9EA7C06636C69656E747D15426974686F6D7020746F6F6C20762E20302E302E337E0A706C61696E2F74657874E1F1'
        Given I should see alert with content 'Signed transaction detected, submit to the ledger?'
        Then I tap alert button with label 'Cancel'

    Scenario: Launch the app with tx blob link
        Then I launch the app with url 'https://xumm.app/tx/1200032280000000240000003241833237B8665D2F4E00135E8DE646589F68400000000000000C732103709723A5967EAAED571B71DB511D87FA44CC7CDDF827A37F457A25E14D862BCD74473045022100C6A6999BD33153C6A236D78438D1BFEEEC810CFE05D0E41339B577560C9143CA022074F07881F559F56593FF680049C12FC3BCBB0B73CE02338651522891D95886F981146078086881F39B191D63B528D914FEA7F8CA2293F9EA7C06636C69656E747D15426974686F6D7020746F6F6C20762E20302E302E337E0A706C61696E2F74657874E1F1'
        Given I should see alert with content 'Signed transaction detected, submit to the ledger?'
        Then I tap alert button with label 'Cancel'

    Scenario: Open the sign request link in foreground
        Then I open the url 'https://xumm.app/sign/2d87bba7-12f8-4b69-a9ac-8bccfbd3d04b'
        Given I should see alert with content 'Payload handled by another client'
        Then I tap alert button with label 'OK'

    Scenario: Launch the app with sign request link
        Then I launch the app with url 'https://xumm.app/sign/2d87bba7-12f8-4b69-a9ac-8bccfbd3d04b'
        Given I should see alert with content 'Payload handled by another client'
        Then I tap alert button with label 'OK'

#    Scenario: Open the payId link in foreground
#        Then I open the url 'xumm$wietse.com'
#        Given I should have 'send-screen'
#        Given I should see 'send-details-view'
#        Then I enter '0.1' in 'amount-input'
#        Then I tap 'next-button'
#        Given I should see 'send-recipient-view'
#        Then I should have 'recipient-rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'
#
#    Scenario: Launch the app with payId link
#        Then I launch the app with url "xumm$wietse.com"
#        Given I should have 'send-screen'
#        Given I should see 'send-details-view'
#        Then I enter '0.1' in 'amount-input'
#        Then I tap 'next-button'
#        Given I should see 'send-recipient-view'
#        Then I should have 'recipient-rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY'







