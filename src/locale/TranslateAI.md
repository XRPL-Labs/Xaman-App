# Prompt (Claude)

Attached a JSON file with translations of an application.

Please return the EXACT SAME JSON format (valid json), without modifying structure, without modifying keys, just translate the values.

Context for the translation: this is for Xaman, a self custodial wallet for the XRP Ledger and Xahau Ledger.

Target language: Dutch. 

Domain specific terminology like TrustLine, NFT, AMM, etc. should stay in place and does not have to be translated.

Variables are indicateed with %{varName}. Make sure that they stay in place as well, and capitals aren't changed in the var names. A variable name CAN NEVER not be in the translated result while it was in the source.

If the the destination translation has a '"moment"' property, it contains separate internationalised, translated notations and values for date notations. If that's present in the translation, keep it in place, all other things can be replaced with your new translations.
