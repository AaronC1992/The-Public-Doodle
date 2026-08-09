# Duck Pond V2 Backlog

## Priority now

1. Sim foundation
2. Factions and neighborhoods
3. Careers and titles
4. Timeline and polish

## Sim foundation tickets

- Create sim tick scheduler at 1 second
- Add duck finite states: idle, swim, forage, rest, socialize
- Add weighted state transition function
- Add neighborhood aware movement target selection
- Add event generator for pair interactions
- Add debug panel for active state counts

## Factions and neighborhoods tickets

- Create faction seed data for 4 factions
- Add neighborhood map with region ids
- Build faction select UI in duck create flow
- Apply home comfort modifier and foreign comfort modifier
- Add faction event scheduler each 15 minutes
- Add faction visual effects layer per region

## Careers and titles tickets

- Create career seed data for 4 starter careers
- Add career assignment endpoint and validation
- Add career XP write path from sim actions
- Add rank thresholds: Rookie, Pro, Master
- Add title unlock mapper by career rank
- Render title and career icon on duck card

## Timeline and polish tickets

- Persist timeline event entries
- Build timeline list UI sorted by time
- Add event filters by faction and career
- Add first run hint overlays
- Tune modifiers based on playtest notes
- Add analytics dashboard queries

## Acceptance checks

- Pond always shows at least one visible behavior per duck in 10 second window
- Faction choice changes measured mood trend in expected direction
- Career rank increases after normal session play
- Timeline shows meaningful events with readable text
- No major frame drop with 200 active ducks

## Stretch ideas after MVP

- Duck friendships and rivalry graph
- Seasonal weather plus faction event combinations
- Community challenge board with featured winners
