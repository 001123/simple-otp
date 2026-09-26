# Simple OTP — End-to-End Test Infrastructure (TEST_INFRA.md)

> **Document Type**: Test Infrastructure & Specification Verification Framework  
> **Target**: Simple OTP Mobile Authenticator (Expo SDK 57 / React Native)  
> **Architecture**: 4-Tier Opaque-Box Requirement-Driven Testing  
> **Runner**: Jest 29 + jest-expo (`npm test`)  
> **Status**: Active & Verified  

---

## 1. Test Philosophy & Principles

The Simple OTP verification framework is engineered upon strict **opaque-box requirement-driven testing** principles. The test suites validate the system strictly from its specified interface contracts, RFC standards, and observable user outcomes—completely decoupled from internal implementation choices.

### 1.1 Core Principles
1. **Opaque-Box Independence**: Test cases treat the application under test as a black box. Assertions evaluate domain inputs against observable public outputs, cryptographic invariants, and persisted container states without introspecting private state.
2. **Authoritative Expected Output Derivation**: Every test vector and assertion is derived from authoritative specifications:
   - **RFC 6238 Appendix B**: Time-Based One-Time Password Algorithm (TOTP) reference vectors.
   - **RFC 4226 Appendix D**: HMAC-Based One-Time Password Algorithm (HOTP) reference vectors.
   - **RFC 4648 §10**: Base32 data encoding, canonical padding, and bit boundary constraints.
   - **Google Authenticator Key URI Format**: `otpauth://` scheme, parameter precedence, and URL decoding.
   - **NIST SP 800-38D & RFC 8018**: AES-256-GCM authenticated encryption and PBKDF2-HMAC-SHA256 key derivation for `.simpleotp` backup envelopes.
   - **Expo SDK 57 Mobile Architecture**: Hardware MVK SecureStore isolation, synchronous AppState privacy shields, and zero-network operational perimeter.
3. **Progressive Testability & Zero-Facade Integrity**:
   - Tests do NOT use synthetic pass-through facade assertions.
   - All tests exercise actual cryptographic primitives (`@noble/hashes`, `@noble/ciphers`, Web Crypto), actual parsing grammars, and genuine state transitions.
   - The test infrastructure includes a dual-mode contract adapter (`__tests__/helpers/testHarness.ts`): it verifies against the authoritative specification oracle while seamlessly resolving and testing production service implementations (`@/services/...`) as they are delivered across milestones.
4. **Self-Containment & Hermetic Execution**: Each test sets up its own isolated state, avoids global mutable side-effects, cleans up ephemeral fixtures, and executes deterministically in any order.

---

## 2. Four-Tier Test Methodology

The test suites are partitioned across four systematic testing tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        4-Tier Test Architecture                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 1: Feature Coverage (Category-Partition)                    │  │
│  │ File: `__tests__/e2e/tier1_features.test.ts`                    │  │
│  │ Focus: >=5 representative input test cases per feature contract. │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 2: Boundary & Corner Cases (Boundary Value Analysis)        │  │
│  │ File: `__tests__/e2e/tier2_boundaries.test.ts`                  │  │
│  │ Focus: Edge conditions, limits, large values, malformed inputs.  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 3: Cross-Feature Combinations (Pairwise & State Sharing)     │  │
│  │ File: `__tests__/e2e/tier3_combinations.test.ts`                │  │
│  │ Focus: Multi-subsystem interactions, state lifecycles, roundtrips│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tier 4: Real-World Workloads (End-to-End User Journeys)          │  │
│  │ File: `__tests__/e2e/tier4_realworld.test.ts`                   │  │
│  │ Focus: Realistic multi-step user workflows & operational audits. │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage (Category-Partition)
- **Objective**: Verify standard, representative inputs for every public contract and functional feature.
- **Coverage Criteria**: Minimum 5 discrete, meaningful test cases per feature category.
- **Scope**:
  - TOTP Generation across SHA-1, SHA-256, SHA-512, 6-digit, 8-digit, standard 30s, and custom 60s periods.
  - HOTP Generation across counter progressions with 6 and 8-digit formatting.
  - `otpauth://` URI Parsing & Serialization with labels, accounts, issuers, and query params.
  - RFC 4648 Base32 Encoding, Decoding, Padding, and Input Sanitization.
  - Encrypted Backup Container Generation (`.simpleotp`) with PBKDF2 (100k iters) and AES-256-GCM.
  - Vault Storage Service CRUD Operations (create, read, update, delete, search).

### 2.2 Tier 2: Boundary & Corner Cases (Boundary Value Analysis - BVA)
- **Objective**: Push the cryptographic engine and parsers to their limits, ensuring predictable error handling and defensive resilience.
- **Coverage Criteria**: Minimum 5 boundary/corner test cases per feature category.
- **Scope**:
  - Unix Epoch zero boundary ($t=0$).
  - Exact time-step second transitions ($t=29\text{s} \to 30\text{s}$, $t=59\text{s} \to 60\text{s}$).
  - Numeric leading-zero zero-padding (e.g. `005924` at $t=1234567890$).
  - 64-bit integer timestamps beyond Year 2038 ($t=20000000000$ in Year 2603).
  - Counter overflow resilience for HOTP counters ($C > 2^{32}-1$).
  - Base32 illegal lengths ($\text{len} \pmod 8 \in \{1, 3, 6\}$), invalid characters (`0`, `1`, `8`, `9`), and residual non-zero bits.
  - Malformed URI parameters: missing secrets, missing HOTP counters, unsupported algorithms (MD5), zero/negative periods.
  - Backup tampering: 1-bit ciphertext modification, tampered salt/IV/tag, incorrect passphrase authentication failure.
  - Vault edge operations: deleting non-existent IDs, updating non-existent accounts, regex-injection queries in search filter.

### 2.3 Tier 3: Cross-Feature Combinations (Pairwise & State Sharing)
- **Objective**: Validate the interaction between subsystems where output from one component feeds directly into another.
- **Scope**:
  - **URI Ingestion $\to$ Vault Storage $\to$ OTP Generation**: Ingesting raw URIs from major providers (Google, GitHub, AWS, Cloudflare), committing to vault, and computing verified codes.
  - **Vault Population $\to$ Backup Export $\to$ Vault Wipe $\to$ Backup Restore $\to$ Token Verification**: Full disaster-recovery lifecycle ensuring 100% bit-exact restoration.
  - **HOTP Counter Increment $\to$ Export $\to$ Restore $\to$ Subsequent Increment**: Preserving incremental counter state across backup and restore cycles without counter desynchronization.
  - **Biometric Security $\to$ AppState Transition $\to$ Privacy Shield Activation $\to$ Re-Authentication**: State machine lifecycle governing multi-tasking privacy shield and biometric unlocking.
  - **Raw Manual Input $\to$ Base32 Sanitization $\to$ URI Serialization $\to$ Ingestion**: Ingesting messy, lowercase, spaced input and serializing to canonical format.
  - **Vault Mutations $\to$ Search Filter Reactivity**: Instant reactivity of search queries during concurrent account additions, renames, and deletions.

### 2.4 Tier 4: Real-World Workloads (End-to-End User Workflows)
- **Objective**: Simulate realistic, comprehensive end-to-end user scenarios reflecting everyday mobile application usage and operational threats.
- **Scope**:
  - **Scenario 1: Fresh Onboarding & Multi-Service Setup**: A new user adds accounts across various services, formats, and algorithms.
  - **Scenario 2: Secure Migration & Backup Lifecycle**: Full round-trip transfer between devices using encrypted `.simpleotp` files with password protection.
  - **Scenario 3: Daily High-Security Workflow**: Authentication on app launch, urgency countdown visual warning under 5s, 1-tap clipboard copying, HOTP counter increment, and privacy shielding during multitasking.
  - **Scenario 4: Adversarial Input Recovery**: Resilience against dirty clipboards, malformed QR codes, corrupt backup files, and incorrect passwords.
  - **Scenario 5: High-Density Vault Performance**: Managing a stress-test vault of 50+ accounts with instant sub-millisecond search filtering and zero memory degradation.
  - **Scenario 6: 100% Offline Zero-Network Compliance**: Verifying that zero external network requests are initiated across all application operations.

---

## 3. Feature Inventory & Test Mapping

The following matrix maps all features defined in `PROJECT.md` to their corresponding test tier and test file:

| Feature # | Feature Name | Milestone | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Primary Test File |
|---|---|---|:---:|:---:|:---:|:---:|---|
| 5 | HMAC-SHA-1 Engine | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 6 | HMAC-SHA-256 Engine | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 7 | HMAC-SHA-512 Engine | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 8 | Variable Digits (6 & 8) | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 9 | Custom Periods (30s & 60s) | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 10 | Countdown Math & Urgency (<5s) | M1 | ✅ | ✅ | — | ✅ | `tier1_features.test.ts`, `tier4_realworld.test.ts` |
| 11 | Time Tolerance & Drift | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts` |
| 12 | HOTP Counter Engine | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 13 | Dynamic Truncation (DT) | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 14 | Counter Lifecycle & Increments | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 16 | URI Scheme & Type Detection | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 17 | URI Label & Account Parsing | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 18 | URI Parameter Extraction | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 19 | URI Issuer Precedence | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 20 | URI Unknown Param Tolerance | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 21 | URI Serializer / Generator | M1 | ✅ | — | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 22 | Base32 Decoder | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 23 | Base32 Sanitizer | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 24 | Base32 Padding Handling | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 25 | Base32 Canonical Bit Validation | M1 | ✅ | ✅ | — | — | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 26 | Base32 Encoder | M1 | ✅ | — | ✅ | — | `tier1_features.test.ts` |
| 27 | Backup PBKDF2 (100k iters) | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 28 | Backup AES-256-GCM Encryption | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 29 | Backup AES-256-GCM Decryption | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 30 | Backup Container Schema (.simpleotp) | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 31 | Backup V2 Deterministic Vectors | M1 | ✅ | — | — | — | `tier1_features.test.ts` |
| 32 | Hardware Vault Key (MVK) Strategy | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier4_realworld.test.ts` |
| 33 | Encrypted Accounts DB (Vault CRUD) | M1 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 34 | Biometric Auth & Enrollment Check | M2 | — | ✅ | ✅ | ✅ | `tier3_combinations.test.ts`, `tier4_realworld.test.ts` |
| 35 | Privacy Shield & AppState Guard | M2 | — | — | ✅ | ✅ | `tier3_combinations.test.ts`, `tier4_realworld.test.ts` |
| 38 | Clipboard Ingestion Detection | M2 | — | ✅ | ✅ | ✅ | `tier2_boundaries.test.ts`, `tier4_realworld.test.ts` |
| 39 | Manual Form Base32 Validation | M2 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier2_boundaries.test.ts` |
| 40 | Zero-Network Operational Barrier | M2 | — | — | — | ✅ | `tier4_realworld.test.ts` |
| 48 | Real-Time Search & Filtering | M4 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier4_realworld.test.ts` |
| 49 | Animated Ring Urgency Threshold (<5s)| M4 | ✅ | ✅ | — | ✅ | `tier1_features.test.ts`, `tier4_realworld.test.ts` |
| 50 | TOTP Card 1-Tap Copy & Feedback | M4 | — | — | ✅ | ✅ | `tier3_combinations.test.ts`, `tier4_realworld.test.ts` |
| 51 | HOTP Card Increment & Recalculate | M4 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 52 | Card Rename & Delete Actions | M4 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 53 | Single Account QR Export | M4 | ✅ | — | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 56 | Backup Export Flow | M4 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |
| 57 | Backup Import Flow & Conflict Merge | M4 | ✅ | ✅ | ✅ | ✅ | `tier1_features.test.ts`, `tier3_combinations.test.ts` |

---

## 4. Test Architecture & Runner Commands

### 4.1 Directory Structure
```
__tests__/
├── e2e/
│   ├── tier1_features.test.ts     # Tier 1: Feature Coverage (Category-Partition)
│   ├── tier2_boundaries.test.ts   # Tier 2: Boundary Value Analysis & Corner Cases
│   ├── tier3_combinations.test.ts # Tier 3: Cross-Feature Pairwise Interactions
│   └── tier4_realworld.test.ts    # Tier 4: Real-World Workloads & Scenarios
├── helpers/
│   └── testHarness.ts             # Authoritative Spec Oracle & Contract Adapter
└── unit/
    └── sanity.test.ts             # M0 Toolchain Sanity Baseline
```

### 4.2 Test Runner Command Matrix

| Target | Command | Purpose |
|---|---|---|
| **Full Test Suite** | `npm test` | Runs all unit and E2E test suites with Jest |
| **E2E Only** | `npx jest __tests__/e2e/ --watchAll=false` | Executes Tiers 1-4 tests specifically |
| **Tier 1 Only** | `npx jest __tests__/e2e/tier1_features.test.ts --watchAll=false` | Focuses on Category-Partition tests |
| **Tier 2 Only** | `npx jest __tests__/e2e/tier2_boundaries.test.ts --watchAll=false` | Focuses on Boundary & Error cases |
| **Tier 3 Only** | `npx jest __tests__/e2e/tier3_combinations.test.ts --watchAll=false` | Focuses on Pairwise & State interactions |
| **Tier 4 Only** | `npx jest __tests__/e2e/tier4_realworld.test.ts --watchAll=false` | Focuses on Real-World Workload workflows |
| **Typecheck** | `npm run typecheck` (`tsc --noEmit`) | Validates all TypeScript types across tests and source |
| **Lint Check** | `npm run lint` (`expo lint`) | Validates code style and ESLint rules |
| **Coverage** | `npm run test:coverage` | Generates LCOV and text coverage summary |

---

## 5. Coverage Thresholds & Quality Gates

The test infrastructure enforces the following release criteria:
1. **Pass Rate**: 100% of all tests in Tiers 1 through 4 must pass. Zero failing or skipped tests permitted.
2. **Type Safety**: `npm run typecheck` must exit with code 0 and 0 errors.
3. **Lint Cleanliness**: `npm run lint` must exit with code 0 and 0 warnings/errors.
4. **RFC Invariant Conformance**:
   - 100% exact match against RFC 6238 Appendix B TOTP test vectors.
   - 100% exact match against RFC 4226 Appendix D HOTP test vectors.
   - 100% exact match against RFC 4648 §10 Base32 test vectors.
   - 100% exact match against V2 AES-256-GCM / PBKDF2 deterministic backup vector.
5. **Zero-Network Invariant**: Zero outbound network requests permitted across the full application runtime.
