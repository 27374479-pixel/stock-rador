# Skill-first architecture

The project now separates **reasoning** from **enforcement**.

## Layer 1: A-share Opportunity Research Skill

The skill searches broadly, verifies claims, builds causal chains, defines a ticker-free beneficiary archetype, finds companies, tests the earnings bridge, evaluates expectations/price and tries to kill the thesis.

The skill is intentionally industry-agnostic. Industry-specific questions are activated only after the real-world shock type is classified.

## Layer 2: deterministic research engine

Code remains responsible for things the AI must not be trusted to improvise:

- cutoff timestamps;
- candidate quarantine;
- source-time validation;
- forbidden outcome-search terms;
- selection locks;
- T+1 execution;
- limit/suspension blockers;
- transaction costs;
- benchmark alignment;
- outcome unlocking;
- validation ledger.

## Why this architecture

Historical backtests showed that the highest-value steps were not fixed numeric scoring. The useful edge came from asking the right causal questions:

- can the company actually capture the bottleneck?
- is the change structural or a short-lived cycle?
- is the product mandatory or adjacent?
- has price moved faster than the duration-weighted earnings opportunity?
- in a cycle rebound, who holds the right inventory and balance sheet?

These questions generalize better than sector-specific if/else rules.

## Learning policy

Backtests update the **question set** faster than they update the **decision thresholds**.

A broadly applicable failure mode can enter the question bank as Experimental after one consumed window. It cannot become a hard gate or numerical threshold until replicated across independent consumed windows or strongly supported by external research.

This allows rapid learning without pretending a single historical miss proves a universal rule.
