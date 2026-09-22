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
      "asOf": "ISO timestamp for this signal",
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
          "basisReconciliation": {
            "externalIndicator": "",
            "companyRealizedBasis": "",
            "basisRisk": ""
          },
          "valuationBridge": {
            "marketCapOrEV": "",
            "bearCase": "",
            "baseCase": "",
            "upsideCase": "",
            "impliedExpectation": ""
          },
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
- each signal should carry its own `asOf`; its evidence timestamps must be <= that signal cutoff, and the signal cutoff must be <= packet `asOf`;
- quarantined tickers are forbidden;
- outcome-oriented discovery terms are forbidden;
- `beneficiaryArchetype` must be written before candidate search in the research process;
- every Candidate needs at least three thesis breakers;
- every Candidate must reconcile external operating indicators to the company's own realized economic basis;
- every Candidate must include a point-in-time valuation/expectation bridge; if either bridge is not supportable, use Watch instead;
- Watch and No Trade are valid outcomes;
- no post-cutoff return or later earnings field belongs in this packet.
