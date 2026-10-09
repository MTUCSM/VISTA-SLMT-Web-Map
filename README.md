## How to run

From root:\
`$ npm.cmd run dev`

Will open a server which can be accessed on a browser from `localhost:5173` and watch for changes in `data/markers.xlsx` to re-extract markers into `public/markers.json` and refresh the server.\
A browser page refresh might be necessary to reflect the changes.


## Implemented
- Marker extraction from xlsx to web map
- Each marker can have at most one of each audio/image/video, which is displayed in a sidepanel when clicking on it
- The sidebar can be opened/closed by pressing the arrow tab to its left, which will also close the audio if it is playing in info mode
- Display marker title on hover

## TODO
- Guided tours (have premade filters for a handful of hand-picked markers)
- Explore hosting options (static page on github + external storage server, all on a mtu-hosted server)
- Any number of each file type per marker (+integration in Info, Mixing, and Form modes)
- Fully customisable description (could even imagine ordering the files inside it in order to have description block > image > block > sound file > block)
- Video integration: closing sidebar also pauses any video playing in it
- Decide naming convention for titles

## Mixing
- Button bottom left of map opens sidebar with mixing mode, active by default, but has a toggle at top of sidebar to swap between active vs passive
- In either modes, only markers featuring audio show up and sidebar can be hidden using an arrow on its center right
Three global settings:
- Volume control: presets volume of new tracks, upper bound of passive mixing
- autoplay: tracks play directly when added in active mode
- radius: distance from which marker audio can be heard in passive mode
- Remove all tracks button

Clicking a marker adds it to the sidebar where it can be removed or played/paused.\

TODO:
- Integration for multiple audio files in a single marker (menu when clicking/hovering marker?)
- Can add all markers of a certain tag to list

### Active
Volume of active tracks is manually controlled through native audio interface.
### Passive
Volume of active tracks is controlled via distance ratio with radius setting.

## Form submission

Click on form toggle at bottom left, then click on the map to select a position, fill in the details, upload the files, and submit.
After review, submission may be added to the map as a new marker

TODO:
- option to request edit to marker

## Search / Filter

Click the search button to open search panel.
Can select a specific field or any to seach within (for instance only search the "musicians" field).
Fields with enumerated values will provide a dropdown list of values to choose from (selecting "Field recording" after choosing field "type").
Fields without will provide a text field in which to type the desired substring (typing in "Padraig" after choosing field "musicians").
(optional) A button allows to add a new filter option for a field, applying an additional filter to the search.
Under the search fields, a button allows to apply the search parameters that have been set, next to it a checkbox allows to apply the search whenever a parameter has changed.
Underneath, global buttons allow to clear the search parameters, or to add all search results to the current mixer.

Once a search has been applied, a scrollable list of marker names appears in the sidebar under the search section.
Each marker provides a button to center on the map and open the marker details.
(future) Each marker with an audio track also provides an option to add to the mixer.
Applying the search also changes which markers are displayed on the map, and displays "Filtered view" along with the search button.

