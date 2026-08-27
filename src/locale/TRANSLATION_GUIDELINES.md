# Translation Guidelines for Xaman

This document provides guidelines for translating Xaman (XRP Ledger crypto wallet) into various languages.

## Context

Xaman is a **cryptocurrency wallet application for the XRP Ledger**. All translations should:
- Reflect financial and cryptocurrency domain terminology
- Maintain appropriate formality and professionalism for the target language
- Consider that users are managing financial assets

## Core Principles

### 1. Replacement Variables

**Preserve all replacement variables exactly as they appear in the source.**

Variable formats include:
- `{{variable}}`
- `{variable}`
- `%{variable}`
- `%s`
- `%d`

**Important: Add spaces around variables for readability**, even in languages that don't typically use spaces between words (e.g., Japanese, Chinese, Thai, Khmer).

**Why?** Variables may be replaced with:
- English text or names
- URLs
- User input
- Numbers or amounts
- Account addresses

Without spaces, these can become unreadable when rendered.

**Examples:**
- ❌ `アカウント{{name}}を削除`
- ✅ `アカウント {{name}} を削除`

- ❌ `查看{{url}}了解详情`
- ✅ `查看 {{url}} 了解详情`

**Exception:** If a variable is part of a grammatical construct specific to your language where spacing would be incorrect, follow your language's rules. When in doubt, prioritize readability.

### 2. XRP Ledger Technical Terminology

**DO NOT translate XRP Ledger protocol-specific terms.** These are official technical entities that should remain in English across all languages.

**Keep in English:**
- **Transaction types**: Escrow, Check, Payment Channel, DepositPreauth, Clawback
- **Protocol entities**: MPToken, Domain ID, Oracle, NFToken, URIToken, Hook, Credential, DID, AMM
- **Transaction names**: AccountSet, TrustSet, OfferCreate, PaymentChannelCreate, etc.
- **Amendment names**: Any XRPL amendment references
- **Technical field names**: When they refer to specific XRPL protocol fields

**Examples:**
- ❌ "MPトークン発行" → ✅ "MPToken発行"
- ❌ "Séquestre" → ✅ "Escrow"
- ❌ "Canal de Pago" → ✅ "Payment Channel"

**Reference:** When uncertain, check the [XRP Ledger documentation](https://xrpl.org/) for official terminology.

### 3. Global Cryptocurrency Terms

Keep these commonly-used global terms in English:
- **XRP** (the asset)
- **XRPL** or **XRP Ledger**
- **NFT** (when used as acronym)
- **Blockchain** (when used as a technical term, though translations may vary by community preference)

**Note:** Check your local crypto community's preferences. Some communities prefer localized terms, others prefer English terms.

### 4. Mobile UI Length Constraints

Xaman is a **mobile application** with limited screen space.

**Guideline:** Translations should be the **same length or shorter** than the English source.

**If your translation is significantly longer (>30% more characters or display width):**
- Find a more concise alternative that maintains accuracy
- Use shorter synonyms
- Simplify sentence structure
- Remove redundant words or particles (if grammatically acceptable)

**Focus especially on:**
- Button labels
- Menu items
- Tab labels
- Short status messages
- Error messages
- Headers and titles

**Examples:**
- ❌ "新しいパスコードをもう一度入力してください" (too long for a button)
- ✅ "パスコードを再入力"

### 5. Localized Cryptocurrency Terminology

**Do translate** common cryptocurrency concepts using established terms in your language:

- Wallet
- Transaction (when not referring to XRPL-specific transaction types)
- Token (when referring generally to tokens, not protocol-specific tokens)
- Account
- Address
- Balance
- Fee
- Network
- Node
- Private key / Secret key
- Public key
- Seed / Recovery phrase

**Check your local crypto community** for preferred translations of these terms.

### 6. Consistency

**Maintain consistency throughout the translation:**
- Use the same translation for the same English term
- Keep terminology consistent across all sections
- If you translate "wallet" as X in one place, use X everywhere
- Create a mental (or written) glossary as you translate

### 7. Context Awareness

**Use the key structure to understand context:**

```json
{
  "send": {
    "confirmation": "Are you sure you want to send {{amount}}?"
  }
}
```

The parent key (`send`) and translation key (`confirmation`) indicate this appears in the send flow as a confirmation message.

**Consider:**
- Where does this text appear? (navigation, error, transaction detail, etc.)
- What is the user doing when they see this?
- What level of formality is appropriate?
- Is this a technical message or user-facing explanation?

### 8. Natural Language Flow

**Respect your language's:**
- Word order
- Grammar rules
- Sentence structure
- Cultural conventions
- Formality levels

**Don't create literal word-for-word translations.** Adapt the message to sound natural in your language while preserving the original meaning.

So: use loan words where they are commonly used, use the English word if it's common for the language to use it for specific terminology. Especially in the context of the technology, the XRP ledger, a crypto wallet. Unless obviously the language/culture doesn't prefer loan words / English words.

E.g.: some languages use English words for things they have native words for, but it's common for some words to be just taken from English. Take for example Estonian, it has several of them, like "main books" literally translated, instead of "ledger" - wherever a western language commonly uses the English variants over native words in modern informal language, prefer the English word instead of the literal translation. But only if using the English word for something is common for the given language.

**Examples:**
- English: "Please enter your passcode to unlock the app."
- Spanish: "Introduce tu código para desbloquear la app."
- Japanese: "アプリのロック解除にはパスコードを入力してください。"

Each follows its language's natural patterns.

### 9. Formality and Tone

**Choose appropriate formality for a financial application:**
- Professional but friendly
- Clear and direct
- Not overly casual
- Not unnecessarily complex

**Consider your language's formality levels:**
- Japanese: Use です/ます form
- Spanish: Consider tú vs. usted based on market norms
- German: Sie vs. du based on app tone
- French: Tu vs. vous based on context

**Check existing translations** in the file to match the established tone.

### 10. Error Messages and Technical Warnings

**For error messages:**
- Be clear and actionable
- Explain what went wrong
- Suggest how to fix it (when applicable)
- Keep technical enough to be accurate but simple enough to understand

**Preserve technical codes and identifiers** that may be used for support/debugging.

**Example:**
```json
"error": "Unable to connect to XRPL node. Please check your connection and try again."
```

Translation should keep "XRPL node" but can adapt the rest naturally.

## Translation Workflow Checklist

When translating, verify:

- [ ] All replacement variables are preserved exactly
- [ ] Spaces added around variables (even in non-spaced languages)
- [ ] XRPL technical terms kept in English
- [ ] Translation length appropriate for mobile UI
- [ ] Terminology consistent with rest of file
- [ ] Natural phrasing in target language
- [ ] Appropriate formality level
- [ ] Context-appropriate word choices
- [ ] Grammar and spelling correct
- [ ] No cultural insensitivity or confusion

## Testing Recommendations

After translation:

1. **Visual check**: Look at the translated app UI to ensure text fits properly
2. **Variable test**: Verify variables are replaced correctly and remain readable
3. **Flow test**: Navigate through user flows to ensure translations make sense in context
4. **Technical test**: Verify XRPL terms are correctly preserved
5. **Native speaker review**: Have a native speaker review for naturalness

## Questions or Clarifications

If you encounter:
- Ambiguous English source text
- Unclear context for a translation
- Terms not covered in these guidelines
- Cultural adaptation questions

Please raise these for clarification rather than guessing.

## Resources

- [XRP Ledger Documentation](https://xrpl.org/) - For technical terminology
- English base file: `en.json` - Reference for source text
- Your language's crypto community forums/sites - For established terminology preferences

---

**Version:** 1.0
**Last Updated:** 2025-11-12
**Maintained by:** Xaman Development Team
