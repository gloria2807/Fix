# FIX: AI Equipment Troubleshooter

## Something broken? Show us.

**FIX is an AI troubleshooting agent that researches real technical information and turns an equipment problem into a practical next action.**

Give FIX:

* A description of the problem
* Equipment type, if known
* Model, if known
* An optional image of the equipment

FIX researches relevant technical sources, evaluates the evidence and returns a structured troubleshooting diagnosis.

### Try a problem

> My thermal printer is printing blank receipts.

Or:

> My inverter is showing error code E05 and keeps beeping.

With an image, FIX can also inspect visible model information, error codes and symptoms before researching the problem.

---

# Why FIX?

When equipment breaks, the answer is often already somewhere online.

The problem is finding the **right information for the specific problem** and deciding what to do with it.

FIX automates that workflow.

Instead of:

**Search → open pages → find manual → compare advice → interpret → decide**

FIX aims for:

**Problem → Research → Evidence → First action**

---

# What FIX does

FIX combines AI reasoning with external web research.

### 1. Understand the problem

FIX reads the user's description and identifies the equipment, symptom and information that matters.

### 2. Inspect an image

If an image is supplied, FIX can use visual evidence such as:

* Equipment appearance
* Model labels
* Error codes
* Visible indicators
* Other relevant visual clues

### 3. Plan the research

FIX determines the specific information it needs instead of performing a generic search.

### 4. Research

FIX uses Apify-powered web research to retrieve relevant information from sources such as:

* Manufacturer documentation
* User manuals
* Technical support pages
* Troubleshooting resources
* Relevant product information

### 5. Evaluate the evidence

The AI considers the retrieved information alongside the user's problem and available visual evidence.

### 6. Recommend the first action

FIX produces one clear, practical place to start.

### 7. Return structured output

The result can be consumed by applications and automated workflows through Apify.

---

# Supported equipment

The current version supports **5 equipment categories**:

| Category        | Examples                                           |
| --------------- | -------------------------------------------------- |
| Generator       | Starting, shutdown and operating problems          |
| Inverter        | Error codes, alarms and operating issues           |
| Thermal printer | Blank prints, printing issues and related symptoms |
| Freezer         | Cooling and operating problems                     |
| Refrigerator    | Cooling and operating problems                     |

FIX is intentionally starting with a focused equipment set so the troubleshooting workflow can be improved category by category.

---

# Example

### Input

```json
{
  "problem": "My thermal printer is printing blank receipts.",
  "equipment": "thermal_printer",
  "model": "",
  "location": "Lagos, Nigeria"
}
```

### FIX workflow

```text
User problem
     ↓
Research planning
     ↓
Apify-powered web research
     ↓
Technical sources
     ↓
Evidence evaluation
     ↓
Troubleshooting diagnosis
```

### Example output

```json
{
  "equipment": "thermal_printer",
  "model": "Unknown",
  "confidence": 0.86,
  "summary": "The symptom is consistent with a paper installation or thermal-paper issue.",
  "likelyIssues": [
    "Thermal paper installed incorrectly",
    "Incorrect paper type"
  ],
  "firstAction": "Check the thermal paper roll and its installation.",
  "steps": [
    "Open the printer cover.",
    "Confirm the roll is installed in the correct orientation.",
    "Check that the paper is thermal paper.",
    "Print another test receipt."
  ],
  "questions": [
    "Does the printer feed paper normally?"
  ],
  "parts": [],
  "serviceNeeded": false,
  "sources": []
}
```

The exact diagnosis and sources depend on the problem supplied and the information retrieved during the run.

---

# Input

| Field       | Type   | Required | Description                                                                         |
| ----------- | ------ | -------: | ----------------------------------------------------------------------------------- |
| `problem`   | string |      Yes | What is wrong with the equipment                                                    |
| `equipment` | string |       No | `generator`, `inverter`, `thermal_printer`, `freezer`, `refrigerator`, or `unknown` |
| `model`     | string |       No | Brand/model if known                                                                |
| `location`  | string |       No | City or region                                                                      |
| `imageData` | string |       No | Temporary image data supplied by an application                                     |

For best results, describe the symptom clearly.

### Good

> My thermal printer feeds paper but the receipt comes out completely blank.

### Better with an image

> My inverter is showing E05 and keeps beeping.

with a clear image of the display.

---

# Output

FIX returns a structured diagnosis containing:

| Field           | Description                                  |
| --------------- | -------------------------------------------- |
| `equipment`     | Equipment identified by FIX                  |
| `model`         | Identified or supplied model                 |
| `confidence`    | Diagnosis confidence                         |
| `summary`       | Concise explanation                          |
| `likelyIssues`  | Potential causes                             |
| `firstAction`   | Recommended first step                       |
| `steps`         | Troubleshooting sequence                     |
| `questions`     | Follow-up questions                          |
| `parts`         | Potential relevant parts                     |
| `serviceNeeded` | Whether professional service may be required |
| `sources`       | Research sources used                        |

This makes the Actor useful both directly and as a component inside another application or automation.

---

# Why Apify?

FIX depends on information that lives outside the model.

Equipment documentation changes. Different models behave differently. Manufacturer guidance matters. A useful troubleshooting system needs to investigate the specific problem rather than rely entirely on static model knowledge.

That is where Apify fits.

**FIX is itself an Apify Actor.**

Its workflow can:

1. Receive a troubleshooting request.
2. Plan targeted research.
3. Invoke web research.
4. Collect relevant sources.
5. Pass the evidence to the reasoning layer.
6. Produce structured output.
7. Store the result in an Apify Dataset.

Apify therefore provides the execution and data-retrieval infrastructure underneath the troubleshooting experience, not just a scraping utility.

---

# Built for automation

Because FIX is an Apify Actor, it can be used beyond the FIX web interface.

Potential integrations include:

* Customer-support workflows
* Equipment support portals
* Maintenance systems
* Chat interfaces
* Field-service applications
* Business automation
* Other AI agents

A developer can run the Actor through Apify and consume its structured output programmatically.

---

# Safety

FIX is a troubleshooting assistant, **not a replacement for a qualified technician**.

The system is designed to avoid dangerous repair instructions involving areas such as:

* High-voltage electrical systems
* Fuel systems
* Refrigerants
* Hazardous components
* Other procedures requiring professional expertise

Where a problem may require professional intervention, FIX can recommend service instead of instructing the user to perform a hazardous repair.

---

# Why this problem matters

Nigeria's latest joint NBS/SMEDAN MSME survey reported **39.65 million MSMEs** in 2020.

**96.9% were micro-enterprises.**

MSMEs contributed **46.31% of national GDP** and accounted for **87.9% of employment** in that survey.

For millions of small businesses, physical equipment is part of the operating system of the business.

A printer can be essential to sales.

A freezer can protect inventory.

An inverter or generator can keep a business operating through power interruptions.

FIX starts with those everyday problems and aims to make the path from **“something is broken”** to **“here's what to try next”** much shorter.

---

# From a personal problem to an Actor

FIX was inspired by seeing small-business operations up close through my mother's shop.

The tools around the business were simple. The problems were not.

When equipment failed, there was rarely a dedicated technical team waiting to diagnose it. Finding the answer meant searching, asking someone, finding a manual or trying to work it out.

That experience led to a simple product question:

> **What if you could just show the problem and get a researched place to start?**

FIX is our first implementation of that idea.

---

# Monetisation

FIX is designed for **Pay Per Event**.

The monetised unit is a completed troubleshooting diagnosis rather than a subscription.

This fits the problem naturally:

**No diagnosis → no event.**

**Completed diagnosis → useful outcome.**

The Actor can therefore be integrated into applications that need troubleshooting as an on-demand capability.

---

# Current capabilities

* ✅ 5 equipment categories
* ✅ Text-based troubleshooting
* ✅ Image input
* ✅ Visual equipment analysis
* ✅ AI-generated research planning
* ✅ Apify-powered web research
* ✅ Technical source retrieval
* ✅ Evidence-based diagnosis
* ✅ Structured JSON output
* ✅ Recommended first action
* ✅ Follow-up questions
* ✅ Parts information
* ✅ Service recommendation
* ✅ Source transparency
* ✅ Safety constraints
* ✅ Apify Dataset output
* ✅ Apify Key-Value Store
* ✅ Pay Per Event architecture

---

# What's next

FIX is starting with a focused set of equipment categories.

The same architecture can expand into:

**More equipment**

→ More generators, appliances, electronics and business equipment.

**Better vision**

→ Stronger model identification, error-code recognition and visual symptom analysis.

**Conversational diagnosis**

→ FIX asks the next question based on the previous answer instead of giving a static checklist.

**Parts**

→ Identify the likely required part and help locate it.

**Service**

→ Connect users with relevant repair providers.

The broader vision is simple:

> **When something in the physical world breaks, the first step toward fixing it should be much easier.**

---

## Built for Ship and Earn Africa

FIX was built for the **Apify × She Code Africa BuildHer Hackathon 2026**.

The programme's goal is bigger than a weekend prototype: **build, publish and monetise technology that addresses real-world problems in Africa.**

FIX is designed around that entire loop:

**Real problem**

→ **Working product**

→ **Apify Actor**

→ **External research**

→ **Structured output**

→ **Published Store product**

→ **Pay Per Event**

The result is not just an AI demo.

It is a reusable troubleshooting capability that can be called, integrated and monetised through Apify.

---

# Try FIX

Give it a problem.

Show it the equipment.

Let it research.

Then find out:

**What should I do next?**

### FIX

**Something broken? Show us.**
