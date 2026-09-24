# FIX

**Something broken? Show us.**

FIX is a visual AI troubleshooting assistant for everyday equipment.

Describe what's wrong, show the equipment, or provide an image. FIX researches relevant technical sources and turns that information into a practical first action and troubleshooting steps.

## The idea

When equipment breaks, people often have to search through scattered manuals, forums, videos, and repair guides before they even know what to try.

FIX turns that process into:

```text
Problem
   ↓
Research
   ↓
Diagnosis
   ↓
Action
   ↓
Fixed
```

The goal isn't to give users another long AI-generated explanation.

**The goal is to help them fix the thing.**

## Current MVP

FIX currently supports:

* Generators
* Inverters
* Thermal printers
* Freezers
* Refrigerators

The first version accepts a problem description and equipment information, researches relevant sources through Apify, and generates a structured troubleshooting result.

## Architecture

```text
                    FIX Web App
                         │
                         ▼
                FIX API / Backend
                         │
                         ▼
                  FIX Apify Actor
                    /         \
                   /           \
                  ▼             ▼
        Apify Research      AI Reasoning
             Actor               │
                  │              │
                  ▼              │
          Technical Sources ─────┘
                         │
                         ▼
                Troubleshooting
                    Result
```

FIX uses Apify not simply as a place to host the application, but as the infrastructure for dynamically researching information needed to solve each problem.

## Example

**Input**

> My thermal printer is printing blank receipts.

**FIX researches**

* Manufacturer troubleshooting documentation
* Thermal printer guides
* Repair resources
* Relevant technical information

**FIX returns**

> **Try this first:** Check the thermal paper roll and its installation.

It then provides additional steps, possible causes, follow-up questions, potential parts, and the sources used.

## Project structure

```text
fix/
├── actor/
│   ├── Fix/
│   │   ├── .actor/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── web/
│       ├── app/
│       ├── components/
│       └── ...
│
└── README.md
```

## Tech stack

### Actor

* TypeScript
* Apify SDK
* Apify Actors
* Apify research Actors
* AI model inference

### Web

* Next.js
* TypeScript
* React

## Running locally

### Actor

```bash
cd actor/Fix
npm install
npm run build
```

Run the Actor locally:

```bash
apify run
```

The AI-powered version is intended to run as a deployed Apify Actor because it uses Apify's hosted infrastructure.

### Web

```bash
cd actor/web
npm install
npm run dev
```

Create a `.env.local` file with the required server-side Apify configuration:

```env
APIFY_TOKEN=your_apify_token
FIX_ACTOR_ID=your_fix_actor_id
```

Never expose `APIFY_TOKEN` to client-side code.

## Roadmap

* [x] Apify Actor
* [x] Web research pipeline
* [x] AI troubleshooting
* [x] Structured diagnosis output
* [x] Source attribution
* [x] Safety-aware troubleshooting
* [ ] Frontend experience
* [ ] Image-based equipment identification
* [ ] Interactive follow-up diagnosis
* [ ] Local repair and parts discovery
* [ ] Additional equipment categories

## Why FIX

The web already contains much of the information people need to repair everyday equipment.

The problem is finding the right information for the **specific thing that is broken**, understanding it, and knowing what to do first.

FIX handles that research and reasoning process for the user.

---

**FIX — Something broken? Show us.**
