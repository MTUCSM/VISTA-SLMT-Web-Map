import L, { Marker } from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { EnumeratedFields, IgnoredTypes, SearchFields, type ActiveTrack, type MarkerData, type MixerMode, type MixerSettings, type SidebarMode, type SidebarVisibility } from "./interfaces"

async function init() {
    // setup map
    const origin:[number,number] = [52.212024620527664, -9.28955873757805]
    const originZoom:number = 11
    const map = L.map('map').setView(origin, originZoom)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map)

    // setup clusters
    // const markerCluster = L.markerClusterGroup({
    //     iconCreateFunction(cluster) {
    //         return L.divIcon({html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
    //             className: "",
    //             iconSize: [40, 40]
    //         });
    //     }
    // });
    // map.addLayer(markerCluster);

    // setup markers
    const response = await fetch("markers.json")
    if (!response.ok)
        throw new Error(response.statusText)
    const jsonMarkers:MarkerData[] = await response.json() as MarkerData[]
    const markers:MarkerData[] = jsonMarkers.filter(e=>!e.type || !IgnoredTypes.includes(e.type))
    const markerObjects:Map<number,L.Marker> = new Map()
    const audioIcon = L.divIcon({
        html: `🎧`,
        className: "marker marker-audio",
        iconSize: [40, 40]
    })
    const regularIcon = L.divIcon({
        html: `📍`,
        className: "marker marker-standard",
        iconSize: [40, 40]
    })
    for (let marker of markers) {
        marker.visible = true
        let markerObject = L.marker([marker.latitude, marker.longitude]).addTo(map)
        // markerCluster.addLayer(markerObject)
        markerObject.on("click", () => {
            selectMarker(marker)
        })
        markerObject.setIcon(marker.audio?audioIcon:regularIcon)
        markerObject.bindTooltip(marker.title,{direction: "top",className: "marker-tooltip"})
        markerObjects.set(marker.id,markerObject)
    }
    function selectMarker(marker:MarkerData){
        if (sidebarMode=="Info"){
            displayMarkerInfo(marker)
            openSidebar()
        }
        else if (sidebarMode=="Mixer"){
            addTrack(marker)
            openSidebar()
        }
        else if (sidebarMode=="Search"){
            displayMarkerInfo(marker)
            setSidebarInfo()
        }
    }
    function displayMarkerInfo(marker:MarkerData){
        const infoSidebar = document.getElementById("infoSidebar")
        if (!infoSidebar) return
        infoSidebar.innerHTML = `
            <h2>${marker.title}</h2>
            ${marker.image ? `<img src="images/${marker.image}">` : ""}
            ${marker.audio ? `<audio controls><source src="audio/${marker.audio}" type="audio/wav"></audio>` : ""}
            ${marker.video ? `<h3>Placeholder Video ${marker.video}</h3>` : ""}
            <p>${marker.description?marker.description:"Description placeholder"}</p>
            ${marker.type ? `<p>Type: ${marker.type}</p>` : ""}
            ${marker.action ? `<p>Action: ${marker.action}</p>` : ""}
            ${marker.musicians ? `<p>Musicians: ${marker.musicians}</p>` : ""}
            ${marker.year ? `<p>Year: ${marker.year}</p>` : ""}
            ${marker.location ? `<p>Location: ${marker.location}</p>` : ""}
            ${marker.link ? `<p>Link: <a href=${marker.link} target=blank>${marker.link}</a></p>` : ""}
            ${marker.source ? `<p>Source: <a href=${marker.source} target=blank>${marker.source}</a></p>` : ""}
        `
    }
    function goToMarker(marker:MarkerData){
        map.flyTo([marker.latitude,marker.longitude])
    }
    function refreshMarkers(){
        markers.forEach(marker=>{
            if (sidebarMode=="Form") setMarkerObjectClass(marker,"marker-none",true)
            else if (sidebarMode=="Mixer") setMarkerObjectClass(marker,"marker-none",!marker.visible || marker.audio==undefined)
            else setMarkerObjectClass(marker,"marker-none",!marker.visible) // Info + Search
        })
    }
    function setMarkerObjectClass(marker:MarkerData,classname:string,status:boolean){
        if (status) markerObjects.get(marker.id)?.getElement()?.classList.add(classname)
        else markerObjects.get(marker.id)?.getElement()?.classList.remove(classname)
    }

    // SIDEBAR BEHAVIOUR
    const sidebar = document.getElementById("sidebar")!
    const infoSidebar = document.getElementById("infoSidebar")!
    const mixerSidebar = document.getElementById("mixerSidebar")!
    const formSidebar = document.getElementById("formSidebar")!
    const searchSidebar = document.getElementById("searchSidebar")!
    let sidebarVisibility:SidebarVisibility = "Hidden"

    function openSidebar() {
        if (sidebarVisibility=="Visible") return
        sidebar.classList.add("open")
        sidebarHideButton.innerHTML = "▶"
        sidebarVisibility = "Visible"
    }
    /** Hides sidebar, pausing content if in Info mode */
    function hideSidebar() {
        if (sidebarVisibility=="Hidden") return
        if (sidebarMode=="Info"){
            const audioElements = document.querySelectorAll("audio")
            audioElements.forEach(audio => {
                audio.pause()
                audio.currentTime = 0
            })
        }
        sidebar.classList.remove("open")
        sidebarHideButton.innerHTML = "◀"
        sidebarVisibility = "Hidden"
    }
    function toggleSidebar(){
        if (sidebarVisibility=="Hidden") openSidebar()
        else hideSidebar()
    }

    // click on map hides sidebar
    map.on("click", mapClick)
    function mapClick(e: L.LeafletMouseEvent) {
        if (sidebarMode=="Form") {
            setFormLatLong(e.latlng.lat,e.latlng.lng)
        }
        else {
            hideSidebar()
        }
    }

    // hide/show sidebar
    const sidebarHideButton = document.getElementById("sidebarHide")!
    sidebarHideButton.addEventListener("click",toggleSidebar)


    let sidebarMode:SidebarMode = "Info"
    // Mode Toggle buttons
    function setSidebarMixer(){
        sidebarMode = "Mixer"
        refreshSidebarHidden()
        openSidebar()
        refreshMarkers()
        activeTracks.forEach(track=>setMarkerObjectClass(track.marker,"pulsating",true))
        // resume pulsations
    }
    function cleanupSidebarMixer(){
        stopAllAudio()
        setSidebarInfo()
        markers.forEach(marker => setMarkerObjectClass(marker,"pulsating",false)) // stop pulsations
    }
    function setSidebarInfo(){
        sidebarMode = "Info"
        refreshSidebarHidden()
        refreshMarkers()
    }
    function setSidebarForm(){
        sidebarMode = "Form"
        refreshSidebarHidden()
        openSidebar()
        refreshMarkers()
        const mapElement = document.getElementById("map")!
        mapElement.classList.add("formMode")

        if (formMarker.getLatLng().lat!=0 || formMarker.getLatLng().lng!=0) formMarker.getElement()?.classList.remove("marker-none") // has been set
    }
    function cleanupSidebarForm(){
        const mapElement = document.getElementById("map")!
        mapElement.classList.remove("formMode")
        formMarker.getElement()?.classList.add("marker-none")
        setSidebarInfo()
    }
    function setFormLatLong(latitude:number,longitude:number){
        let formLatitude = document.getElementById("formLatitude")!
        formLatitude.innerHTML = String(latitude)
        let formLongitude = document.getElementById("formLongitude")!
        formLongitude.innerHTML = String(longitude)
        formMarker.setLatLng([latitude,longitude])
        formMarker.getElement()?.classList.remove("marker-none")
    }
    const searchFilters = document.getElementById("searchFilters")!
    // collect each value present for each enumerated field
    var EnumeratedSearchFields:{[index:string]:string[]} = {}
    EnumeratedFields.forEach(field=>EnumeratedSearchFields[field] = markers.reduce<any[]>((p,c)=>(c[field]&&!p.includes(c[field]))?p.concat([String(c[field])]):p,[]))

    function setSidebarSearch() {
        sidebarMode = "Search"
        refreshSidebarHidden()
        openSidebar()
        // need to create a search filter if none have been created yet (ie on first setSidebarSearch call)
        if (searchFilters.childElementCount==0) appendSearchFilter(searchFilters.childElementCount)
    }
    function capitalize(s:string):string{
        return s.substring(0,1).toUpperCase()+s.substring(1)
    }
    function appendSearchFilter(filterIndex:number){
        var newFilter = document.createElement("div")
        var options = SearchFields.map(fieldName=>`<option value="${fieldName}">${capitalize(fieldName)}</option>`).join("\n")
        newFilter.innerHTML = `
            <div id="filter-${filterIndex}">
                <p>
                    <label>Field</label>
                    <select id="filterFieldSelect-${filterIndex}" name="field">
                        <option value="any">Any</option>
                        ${options}
                    </select>
                </p>
                <p>
                    <label>Value:</label>
                    <input id="filterValueSearch-${filterIndex}" type="search">
                    <select id="filterValueSelect-${filterIndex}" name="field" hidden>
                    </select>
                </p>
                ${filterIndex>0?`<p><button id="filterRemove-${filterIndex}">Remove filter</button></p>`:""}
            </div>
        `

        searchFilters.appendChild(newFilter)
        document.getElementById(`filterFieldSelect-${filterIndex}`)?.addEventListener("change",e=>{
            const val:string = (e.target as HTMLSelectElement).value
            const search = document.getElementById(`filterValueSearch-${filterIndex}`)!
            const sel:HTMLSelectElement = document.getElementById(`filterValueSelect-${filterIndex}`)! as HTMLSelectElement
            if (val=="type"){

            }
            const enumerated = EnumeratedSearchFields[val]
            if (enumerated){
                // clear
                while (sel.options.length>0) sel.remove(0)
                // add options
                enumerated.forEach(e=>{
                    const option:HTMLOptionElement = document.createElement("option")
                    option.value = e
                    option.text = capitalize(e)
                    sel.add(option)
                })
                search.hidden = true
                sel.hidden = false
            }
            else {
                search.hidden = false
                sel.hidden = true
            }
        })
        document.getElementById(`filterRemove-${filterIndex}`)?.addEventListener("click",e=>{
            const filterDiv:Node = (e.target as HTMLElement).parentNode!.parentNode!
            // console.log(filterDiv)
            newFilter.removeChild(filterDiv)
        })
        document.getElementById(`filterValueSearch-${filterIndex}`)!.addEventListener("change",applyFilters)
        document.getElementById(`filterValueSelect-${filterIndex}`)!.addEventListener("change",applyFilters)
    }
    // setup listeners for filter value changes to trigger if checkbox checked
    document.getElementById("addFilterButton")!.addEventListener("click",_=>{
        appendSearchFilter(searchFilters.childElementCount)
    })
    document.getElementById("applyFilterButton")!.addEventListener("click",_=>{
        applyFilters()
    })

    function cleanupSidebarSearch() {
        return
    }
    function refreshSidebarHidden(){
        infoSidebar.hidden = sidebarMode!="Info"
        mixerSidebar.hidden = sidebarMode!="Mixer"
        formSidebar.hidden = sidebarMode!="Form"
        searchSidebar.hidden = sidebarMode!="Search"
    }
    function cleanupSidebar(){
        if (sidebarMode=="Mixer") cleanupSidebarMixer()
        if (sidebarMode=="Form") cleanupSidebarForm()
        if (sidebarMode=="Search") cleanupSidebarSearch()
        setSidebarInfo()
    }
    /** Mixer -> Info /  Info -> Mixer / Form -> Mixer*/
    function toggleMixer(){
        if (sidebarMode=="Mixer") {
            cleanupSidebar()
            hideSidebar()
        }
        else {
            cleanupSidebar()
            setSidebarMixer()
        }
    }
    function toggleForm(){
        if (sidebarMode=="Form") {
            cleanupSidebar()
            hideSidebar()
        }
        else {
            cleanupSidebar()
            setSidebarForm()
        }
    }
    function toggleSearch(){
        if (sidebarMode=="Search") {
            cleanupSidebar()
            hideSidebar()
        }
        else {
            cleanupSidebar()
            setSidebarSearch()
        }
    }
    const mixerButton = document.getElementById("mixerButton")!
    mixerButton.addEventListener("click",toggleMixer)
    const formButton = document.getElementById("formButton")!
    formButton.addEventListener("click",toggleForm)
    const searchButton = document.getElementById("searchButton")!
    searchButton.addEventListener("click",toggleSearch)



    // MIXER SETTINGS
    let mixerMode:MixerMode = "Active"
    let mixerSettings:MixerSettings = {volume:1.0, radius:500, autoplay:false}
    const globalVolumeSlider = document.getElementById("globalVolume")! as HTMLInputElement
    globalVolumeSlider.addEventListener("input",()=>{
        mixerSettings.volume=Number(globalVolumeSlider.value)
        document.getElementById("volumeValue")!.textContent = `${Math.round(mixerSettings.volume*100)}%`
    })
    globalVolumeSlider.value = String(mixerSettings.volume)
    const globalAutoplayCheck = document.getElementById("globalAutoplay")! as HTMLInputElement
    globalAutoplayCheck.addEventListener("change",()=>{
        mixerSettings.autoplay=globalAutoplayCheck.checked
    })
    globalAutoplayCheck.checked = mixerSettings.autoplay
    const globalRadiusSlider = document.getElementById("globalRadius")! as HTMLInputElement
    globalRadiusSlider.addEventListener("input",()=>{
        mixerSettings.radius=Number(globalRadiusSlider.value)
        document.getElementById("radiusValue")!.textContent = `${mixerSettings.radius} m`
    })
    globalRadiusSlider.value = String(mixerSettings.radius)
    const mixerModeButton = document.getElementById("mixerModeButton")!
    const mixerContent = document.getElementById("mixerContent")!
    function toggleMixerMode(){
        if (mixerMode=="Active"){
            mixerMode = "Passive"
            mixerModeButton.innerHTML = "Switch to active"
            stopAllAudio()
        }
        else {
            mixerMode = "Active"
            mixerModeButton.innerHTML = "Switch to passive"
        }
    }
    mixerModeButton.addEventListener("click",toggleMixerMode)
    const clearTracksButton = document.getElementById("clearTracksButton")!
    clearTracksButton.addEventListener("click",()=>activeTracks.forEach(t=>removeTrack(t)))

    // TRACKS
    const activeTracks:Map<number, ActiveTrack> = new Map<number, ActiveTrack>()
    function addTrack(marker: MarkerData) {
        if (!marker.audio) return // no audio
        if (activeTracks.has(marker.id)) return // already has a track

        setMarkerObjectClass(marker,"pulsating",true)

        let newTrack = document.createElement("div")
        newTrack.className = "track"
        newTrack.dataset.markerId = String(marker.id)
        newTrack.innerHTML = `
            <h4>${marker.title}</h4>
            <audio controls><source src="audio/${marker.audio}" type="audio/wav"></audio>
            <button class="remove">Remove</button>
            <button class="center">Center</button>
        `
        newTrack.querySelector(".remove")?.addEventListener("click",()=>removeTrackId(marker.id))
        newTrack.querySelector(".center")?.addEventListener("click",()=>{goToMarker(marker);hideSidebar()})

        mixerContent.appendChild(newTrack)
        const audio:HTMLAudioElement = newTrack.querySelector("audio")!
        audio.volume = mixerSettings.volume
        audio.loop = true
        if (mixerSettings.autoplay) audio.play()

        const track:ActiveTrack = { marker, audio, volume: 1, playing: false}
        activeTracks.set(marker.id,track)
    }
    function removeTrackId(id:number) {
        let track = activeTracks.get(id)
        if (!track) return

        removeTrack(track)
    }
    function removeTrack(track:ActiveTrack){
        track.audio.pause()
        let trackElement = mixerContent.querySelector(`[data-marker-id="${track.marker.id}"]`)
        trackElement?.remove()
        setMarkerObjectClass(track.marker,"pulsating",false)
        activeTracks.delete(track.marker.id)
    }
    function stopAllAudio(){
        activeTracks.forEach(track=>{
            track.audio.pause()
            track.audio.currentTime = 0
        })
    }

    // add any tracks still present from a refresh
    document.getElementById("mixerContent")?.querySelectorAll(".track").forEach(e=>{
        let markerId = (e as HTMLElement).dataset.markerId
        if (markerId===undefined) return
        let marker = markers.find(v=>v.id==Number(markerId))
        if (!marker) return
        addTrack(marker)
    })

    // PASSIVE MIXER
    map.on("mousemove",updadePassiveMixer)
    function updadePassiveMixer(e:L.LeafletMouseEvent){
        if (mixerMode=="Active") return
        const mousePosition:L.LatLng = e.latlng
        activeTracks.forEach(track=>{
            const markerPosition:L.LatLng = L.latLng(track.marker.latitude,track.marker.longitude)
            const distance:number = mousePosition.distanceTo(markerPosition)

            let volume:number = 1- (distance/mixerSettings.radius)

            volume = Math.max(0,volume)
            volume = Math.min(1,volume)

            track.audio.volume = track.audio.volume * 0.9 + volume* 0.1;
        })
    }

    // FORM
    // Marker placeholder when making form
    const formMarker = L.marker([0, 0]).addTo(map)
    formMarker.setIcon(regularIcon)
    formMarker.getElement()?.classList.add("marker-none")
    formMarker.bindTooltip("Placeholder Marker",{direction: "top",className: "marker-tooltip"})


    // SEARCH
    const filteredViewInfo = document.getElementById("filteredViewInfo")!
    function showFilteredViewInfo() {
        filteredViewInfo.style.display = "inline"
    }
    function hideFilteredViewInfo() {
        filteredViewInfo.style.display = "none"
    }
    function applyFilters(){

        var filterParams:{field:keyof MarkerData,value:string}[] = []
        for (let index = 0; index < searchFilters.childElementCount; index++) {
            const searchField:keyof MarkerData = (document.getElementById(`filterFieldSelect-${index}`)! as HTMLSelectElement).value as keyof MarkerData
            const searchValue =
            (EnumeratedFields.includes(searchField)?document.getElementById(`filterValueSelect-${index}`)! as HTMLSelectElement:document.getElementById(`filterValueSearch-${index}`)! as HTMLSelectElement).value

            filterParams.push({field:searchField,value:searchValue})
        }

        const resultsDiv = document.getElementById("searchResults")!
        // clear children
        while (resultsDiv.firstChild) resultsDiv.removeChild(resultsDiv.firstChild!)

        var filteredMarkers:MarkerData[] = markers.filter(marker=>filterParams.reduce((p,c)=>{
            if (!p) return false
            if (!marker[c.field]) return false
            return String(marker[c.field]).toLowerCase().includes(c.value.toLowerCase())
        },true))

        console.log(filteredMarkers)
        // add markers to list
        filteredMarkers.forEach(marker=>{
            var markerElement = document.createElement("p")
            markerElement.innerHTML = `
                <button>Center</button>
                <label>${marker.title}</label>
            `
            resultsDiv.appendChild(markerElement)
            console.log(markerElement.querySelector("button"))
            markerElement.querySelector("button")?.addEventListener("click",_=>{
                goToMarker(marker)
                selectMarker(marker)
            })
        })

        // set display status of markers
        markers.forEach(marker=>marker.visible=false)
        filteredMarkers.forEach(marker=>marker.visible=true)
        refreshMarkers()
        showFilteredViewInfo()

    }
}





init().catch(console.error)

