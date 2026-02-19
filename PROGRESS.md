# Progress: Updated Gestures

## Current behavior / what I changed
- Movable drag gestures show Start + End markers
- Has annotation / text pop-ups if you hover over an icon to see its name / behavior
- fixed some icon color consistencies

## Files touched
- `src/.../gesture-menu.tsx`
- `src/lib/utils/gesture-options.tsx`
- `src/app/globals.css`

## Known issues / TODO
- Some of the icons (double tap, touch and hold), are more zoomed out than the rest of the icons
- When selecting on a direction (left, right, top, down), could change to highlight that one directional icon (instead of just having the annotation text pop up appear)

## How to test
1. Run the app and open a capture edit screen.
2. Add a gesture marker and select each gesture type to test
   
