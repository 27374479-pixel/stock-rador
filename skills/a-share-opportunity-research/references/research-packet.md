# Research Packet Contract

A historical research packet is the boundary between AI reasoning and the deterministic engine.

Minimum shape:

```json
{
  "schemaVersion": "3.0",
  "mode": "historical",
  "windowId": "skill-v3-YYYY-MM",
  "asOf": "ISO timestamp",
  "outcomeDataUsed": false,
  "discoveryQueries": [],
  "signals": [
    {
      "id": "signal-id",
      "claim": "real-world change",
      "shockTypes": [],
      "evidence": [],
      "contraryEvidence": [],
      "causalChain": [],
      "beneficiaryArchetype": "ticker-free ideal beneficiary",
      "opportunityAssessment": {
        "profitPoolChange": "",
        "duration": "",
        "expectationGap": "",
        "keyUncertainty": ""
      },
      "candidates": [
        {
          "ticker": "000000.SZ",
          "name": "Company",
          "decision": "Candidate",
          "economicExposure": "",
          "monetization": "",
          "earningsBridge": [],
          "balanceSheetCycle": "",
          "competitiveQuality": "",
          "priceExpectation": "",
          "contraryEvidence": [],
          "thesisBreakers": [],
          "unansweredQuestions": []
        }
      ],
      "finalDecision": {
        "primaryPick": "000000.SZ or null",
        "candidateBasket": [],
        "noTradeReason": null
      }
    }
  ]
}
```

Rules:
- `outcomeDataUsed` must be false in historical selection.
- all evidence timestamps must be <= `asOf`;
- quarantined tickers are forbidden;
- outcome-oriented discovery terms are forbidden;
- `beneficiaryArchetype` must be written before candidate search in the research process;
- every Candidate needs at least three thesis breakers;
- Watch and No Trade are valid outcomes;
- no post-cutoff return or later earnings field belongs in this packet.
