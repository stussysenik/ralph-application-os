# Ralph Interview Answers

Prompt: Build a computer vision app that scans food ingredients, recommends healthier alternatives, price matches equivalent products, and helps users compare options while shopping.
Primary Category: vision-commerce
Execution Mode: semantic-runtime-plan

Instructions:
- answer the blocking questions first
- keep answers concrete and short
- languages and frameworks are optional unless they are true constraints

## alternative-ranking-and-price-comparison
Category: proof
Priority: high (blocking)
Question: What makes an alternative better: health score, allergen avoidance, ingredient quality, price delta, retailer availability, or some weighted mix?
Why: Recommendation and price-comparison logic are the semantic center of this product.
Answer:
- Better means a weighted mix of health score, allergen safety, ingredient quality, and price delta, with retailer availability required.

## capture-extraction-and-provenance
Category: runtime
Priority: high (blocking)
Question: What capture inputs are supported first, how are ingredients extracted, and how should confidence and provenance be stored?
Why: Vision-assisted commerce depends on trustworthy extraction, not just downstream UX.
Answer:
- Support phone camera captures of packaged food labels first, extract ingredients with OCR, and store confidence plus the source image reference on each observation.

## core-records
Category: data
Priority: high (blocking)
Question: What are the 3-7 core records, components, or semantic objects this system must track or model?
Why: The data model is the enabling core value, so the first durable objects must be explicit.
Answer:
- UserProfile: dietaryGoals, allergens, budgetMode
- ScanSession: capturedAt, status, location
- Product: name, brand, packageSize, category
- IngredientObservation: rawText, normalizedIngredient, confidenceScore
- NutritionProfile: sugarScore, proteinScore, additiveScore, overallHealthScore
- AlternativeRecommendation: reason, rank, savingsEstimate, healthDelta
- RetailerOffer: retailerName, price, currency, inStockStatus

## core-workflow
Category: workflow
Priority: high (blocking)
Question: What is the critical lifecycle, execution loop, or workflow from start to finish?
Why: The platform needs the main transitions or control flow before it can build or prove behavior.
Answer:
- ScanSession: captured -> extracted -> normalized -> scored -> compared -> saved

## primary-user-and-outcome
Category: domain
Priority: high (blocking)
Question: Who is the primary user, and what is the one outcome they must achieve reliably?
Why: The product needs a concrete operator and success condition before modeling.
Answer:
- Health-conscious shoppers should reliably understand whether a scanned product is a good choice and immediately see healthier similarly-priced alternatives.

## target-surface
Category: interface
Priority: high (blocking)
Question: What should the first implementation target: web app, CLI, API, worker, mobile, desktop, or a mix?
Why: Target surface affects builders, runtime assumptions, and proof flows.
Answer:
- mobile, web, api

## language-constraints
Category: implementation
Priority: medium
Question: Do you have hard language, framework, or runtime constraints, or should the platform choose?
Why: Language choices are optional implementation constraints, not semantic source of truth.
Answer:
- Platform chooses. Python for vision and scoring pipelines is acceptable; TypeScript for product surfaces is acceptable.
