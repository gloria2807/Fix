# FIX Equipment Troubleshooter

**Something broken? Show us.**

FIX is an AI-powered troubleshooting Actor that helps people diagnose everyday equipment problems using web research and practical, step-by-step guidance.

Instead of relying only on a model's existing knowledge, FIX researches relevant troubleshooting guides, manuals, and technical sources through Apify, then uses that information to produce a practical diagnosis.

## What FIX does

Give FIX:

* A description of the problem
* The equipment type
* The model, if known
* A location, if relevant

FIX then:

1. Understands the equipment and reported symptoms.
2. Searches relevant technical and troubleshooting sources.
3. Collects the most relevant results.
4. Uses AI to reason over the researched information.
5. Identifies likely causes.
6. Recommends the safest useful first action.
7. Provides additional troubleshooting steps.
8. Identifies potential parts that may be needed.
9. Indicates when professional service may be required.
10. Returns the research sources used.

## Supported equipment

The current version supports:

* Generators
* Inverters
* Thermal printers
* Freezers
* Refrigerators

More equipment categories can be added as FIX evolves.

## Input

Example:

```json
{
  "problem": "My thermal printer is printing blank receipts.",
  "equipment": "thermal_printer",
  "model": "",
  "location": "Lagos, Nigeria"
}
```

### Input fields

| Field       | Required | Description                  |
| ----------- | -------- | ---------------------------- |
| `problem`   | Yes      | Description of what is wrong |
| `equipment` | No       | Equipment type               |
| `model`     | No       | Equipment model              |
| `location`  | No       | City or region               |
| `imageUrl`  | No       | Public image URL             |

## Output

FIX returns a structured diagnosis containing:

* Equipment
* Model
* Confidence
* Diagnosis summary
* Likely issues
* First troubleshooting action
* Step-by-step troubleshooting
* Follow-up questions
* Potential parts
* Whether professional service may be required
* Research sources

Example:

```json
{
  "equipment": "thermal printer",
  "model": "",
  "confidence": 0.8,
  "summary": "Your thermal printer is printing blank receipts, which could be due to incorrect paper loading, issues with the thermal paper itself, or a dirty print head.",
  "likelyIssues": [
    "Thermal paper loaded incorrectly",
    "Defective or incorrect thermal paper",
    "Dirty print head"
  ],
  "firstAction": "Check the thermal paper roll and its installation.",
  "steps": [
    "Turn off the printer.",
    "Open the printer cover.",
    "Remove the paper roll.",
    "Check that the paper is thermal paper.",
    "Reinstall the roll with the thermal side facing the print head."
  ],
  "questions": [
    "Did you recently replace the paper roll?"
  ],
  "parts": [
    "Thermal paper roll"
  ],
  "serviceNeeded": false,
  "sources": []
}
```

## Safety

FIX prioritizes safe troubleshooting.

It should not instruct users to perform dangerous electrical, fuel, refrigeration, high-voltage, or mechanical repairs. Where a problem may require specialist work, FIX can recommend professional service instead.

## How it works

FIX uses Apify as the orchestration and research layer.

```text
User problem
     ↓
FIX Actor
     ↓
Apify research Actor
     ↓
Technical sources
     ↓
AI reasoning
     ↓
Structured troubleshooting result
```

This allows FIX to research the specific problem rather than relying solely on static model knowledge.

## Use cases

FIX can help with problems such as:

* A thermal printer producing blank receipts
* A generator starting and shutting down
* A freezer running without cooling
* An inverter showing an unexpected error
* A refrigerator behaving abnormally

## Development

The Actor is built with:

* TypeScript
* Apify SDK
* Apify Actors
* Apify research infrastructure
* AI via the Apify-supported model interface

## Status

FIX is currently an early working version. The core troubleshooting pipeline is functional, with additional capabilities such as image-based equipment identification and interactive follow-up diagnosis planned for future versions.

---

**FIX — Something broken? Show us.**
