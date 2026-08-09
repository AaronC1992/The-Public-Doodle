# Duck Pond V2 Spec

## Goal
Build three features that increase return visits and player attachment.

- Feature 2: Mini life sim in the pond
- Feature 4: Factions and neighborhoods
- Feature 5: Duck careers and titles

## Product pillars

- Alive world: Ducks should look active even when the player does nothing.
- Identity: Every duck should feel like it belongs somewhere.
- Progress: Players should have small goals every session.

## Success metrics

- Day 1 return rate up by 20 percent
- Average session length up by 30 percent
- Ducks created per player up by 25 percent
- At least 40 percent of active players assign a faction and career

## Feature 2 mini life sim

### Core loop

1. Player opens the pond.
2. Ducks are moving and reacting in real time.
3. Player watches moments, taps ducks, and checks recent stories.
4. Player returns later to see new outcomes.

### Sim rules MVP

- Tick rate: 1 update each second.
- World is a simple grid or nav mesh with zones.
- Each duck has state: idle, swim, forage, rest, socialize.
- State changes happen from weighted probabilities and local context.

### Behavior examples

- If food nearby then forage chance increases.
- If friend nearby then socialize chance increases.
- If weather is rain then swim speed gets a boost.
- If in crowded zone then rest chance decreases.

### Event moments

Generate small events from interactions.

- Shared snack
- Friendly splash
- Tiny race
- Group nap

Each event creates one short timeline item for that duck.

## Feature 4 factions and neighborhoods

### Factions

Start with four factions.

- Royal Canal: Elegant style, high social bonus
- Punk Pier: Fast movement, high rivalry chance
- Zen Marsh: High rest recovery, low conflict
- Chaos Cove: Random boosts, random setbacks

### Neighborhood design

- Pond is divided into four visible regions.
- Each region has visual style, music cue, and behavior modifier.
- New ducks choose a faction at release.
- Ducks can visit other neighborhoods with lower comfort.

### Faction effects MVP

- Home neighborhood gives plus 10 percent mood gain.
- Foreign neighborhood gives minus 10 percent mood gain.
- Faction events run every 15 minutes.

### Faction events examples

- Royal parade gives social bonus in Royal Canal
- Pier sprint gives speed bonus in Punk Pier
- Marsh calm gives stress drop in Zen Marsh
- Cove frenzy gives random state changes in Chaos Cove

## Feature 5 careers and titles

### Career system

Each duck can hold one career.

Starter careers.

- Lifeguard: Helps nearby low mood ducks
- Bread Inspector: Better forage outcome
- Pond DJ: Raises social chance in local area
- Weather Duck: Detects event window earlier

### Progression

- Career XP from related actions.
- Rank ladder: Rookie, Pro, Master.
- Rank unlocks visual flair and title text.

### Titles

Titles are visible on profile and hover card.

- Breeze Runner
- Marsh Mediator
- Crumb Baron
- Splash Virtuoso

### Balance rules MVP

- Career boosts are small, between 5 and 12 percent.
- No career is mandatory for success.
- Cooldown on active effects prevents spam loops.

## Data model draft

## Duck

- id
- name
- ownerId
- factionId
- neighborhoodId
- careerId
- careerRank
- mood
- energy
- hunger
- social
- speed
- createdAt

## Relationship

- duckAId
- duckBId
- affinityScore
- rivalryScore
- lastInteractionAt

## TimelineEvent

- id
- duckId
- type
- summary
- impactMood
- impactCareerXp
- createdAt

## Faction

- id
- name
- neighborhoodId
- passiveModifiers

## Career

- id
- name
- passiveModifiers
- triggerRules

## SimTick log optional for analytics

- tickAt
- activeDucks
- eventsCreated
- avgMood

## Backend endpoints sketch

- POST /ducks create duck with faction and optional career
- GET /pond/state active duck snapshots and region modifiers
- POST /ducks/{id}/career assign or change career
- GET /ducks/{id}/timeline latest events
- GET /factions list faction metadata
- GET /careers list career metadata

## Client views MVP

- Pond view with neighborhoods and active ducks
- Duck card with mood bars, faction badge, career title
- Timeline feed for recent moments
- Faction picker at duck release
- Career picker in duck profile

## Milestone plan four weeks

### Week 1 world and sim base

- Create duck state model
- Build 1 second tick loop
- Add movement and basic state transitions
- Render duck motion in pond view

### Week 2 factions and neighborhoods

- Build region map and style layer
- Add faction selection on create
- Apply home and foreign mood modifiers
- Add rotating faction events

### Week 3 careers and progression

- Add career schema and assignment flow
- Add XP gain from actions
- Add rank ladder and title unlocks
- Show title on card and profile

### Week 4 polish and tuning

- Add timeline moments
- Tune modifier ranges for fairness
- Add analytics events and dashboard slices
- Run playtest and adjust pacing

## Risks and mitigations

- Risk: Sim becomes heavy with many ducks
  - Mitigation: Cap active ducks per viewport and run far ducks at lower tick rate
- Risk: Faction balance drift
  - Mitigation: Weekly metric review by faction win and mood averages
- Risk: Career choice paralysis
  - Mitigation: Recommend one career by duck behavior profile

## First implementation slice two days

Day 1
- Build sim loop for idle, swim, forage, rest
- Render visible state icon over each duck

Day 2
- Add four faction regions and base modifiers
- Add career assignment and one passive effect per career

At end of day 2 you have a playable V2 core that already feels deeper than pure gallery mode.
