import XLSX from "xlsx";
import fs from "fs";

export function buildMarkers(){
    const workbook = XLSX.readFile("data/markers.xlsx");

    const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

    const rows =
        XLSX.utils.sheet_to_json(sheet);

    // {
    //     id: 7,
    //     title: 'Kerry Fiddles (Album)',
    //     latitude: 52.2319877718807,
    //     longitude: -9.4623811395117,
    //     image: 'kerry-fiddles-recto-and-verso.jpg',
    //     audio: 'KerryFiddlesSample.wav',
    //     source: 'https://rushymountain.com/2017/06/23/kerry-fiddles/',
    //     description: "This iconic album of Sliabh Luachra fiddle music was recorded in Charlie Horan's bar, Castleisland, in 1952, by Seamus Ennis. It features Padraig O'Keefe and two of his students, Denis Murphy and Julia Clifford. The album can be found on Spotify:  https://open.spotify.com/album/3RdoEe749R0wdL4TlJdoAA"
    // }
    let markers = []



    rows.forEach((row,index)=>{
        index+=2 // account for header and rows starting at 1
        if (row.include == "FALSE"){
            console.log(`Row ${index} not included`)
            return
        }
        if (!row.coordinates){
            // console.log(`Row ${index} no coordinates, skipping`)
            // console.log(row)
            return
        }
        try {
            var coordinates_string = row.coordinates
            var lat,lon
            if (coordinates_string.includes("N")){
                // format 52°18'45.1"N 9°16'17.9"W
                var s = coordinates_string.split(" ")
                var lat_string = s[0]
                var lon_string = s[1]
                s = lat_string.split("°")
                lat = Number(s[0]) // 52
                s = s[1].split("'")
                lat += Number(s[0])/100 // 18
                s = s[1].split('"')
                lat += Number(s[0])/10000 // 45.1
                lat *= s[1]=="S"?-1:1 // negative if south

                s = lon_string.split("°")
                lon = Number(s[0]) // 9
                s = s[1].split("'")
                lon += Number(s[0])/100 // 16
                s = s[1].split('"')
                lon += Number(s[0])/10000 // 17.9
                lon *= s[1]=="W"?-1:1 // negative if west
            }
            else if (coordinates_string && coordinates_string.includes(",")){
                // 52.06107950209387, -9.49281117547677
                var s = coordinates_string.split(",")
                lat = Number(s[0])
                lon = Number(s[1])
            }
            else {
                // unknown format, skip
                console.log(`Row ${index} unknown format: ${row.coordinates}`)
                return
            }

            if (row.image){ // only accept .png or .jpg
                row.image = row.image.trim()
                if (!(row.image.endsWith(".png") | row.image.endsWith(".jpg"))){
                    console.log(`Row ${index} invalid image format: ${row.image}`)
                    row.image = undefined
                }
            }
            if (row.audio){ // only accept .wav
                row.audio = row.audio.trim()
                if (!row.audio.endsWith(".wav")){
                    console.log(`Row ${index} invalid audio format: ${row.audio}`)
                    row.audio = undefined
                }
            }

            let marker = {
                // id: number,
                id: Number(row.id),
                // title: string,
                title:row.title,
                // latitude: number,
                latitude:lat,
                // longitude: number,
                longitude:lon,
                // audioRadius:number
                audioRadius:500,
                // type?:string;
                type:row.type,
                // image?: string,
                image:row.image,
                // audio?: string,
                audio:row.audio,
                // video?: string,
                video:row.video,
                // source?: string,
                source:row.source,
                // link?: string,
                link:row.link,
                // description?: string,
                description:row.description,
                // action?:string;
                action:row.action,
                // musicians?:string;
                musicians:row.musicians,
                // year?:string;
                year:row.year,
                // location?:string;
                location:row.location,
            }
            // check files
            if (marker.audio && !checkFile("public/audio/"+marker.audio)) console.log("%cCould not access audio file %s","color: red",marker.audio)
            if (marker.image && !checkFile("public/images/"+marker.image)) console.log("%cCould not access image file %s","color: red",marker.image)
            if (marker.video && !checkFile("public/videos/"+marker.video)) console.log("%cCould not access video file %s","color: red",marker.video)
            markers.push(marker)
        } catch (error) {
            // failed to parse coordinates
            console.log(`Row ${index} failed to parse ${row.coordinates} with error ${error}`)
            console.log(row)
        }
    })
    fs.writeFileSync(
        "public/markers.json",
        JSON.stringify(markers, null, 2)
    );

    console.log(
        `Generated ${markers.length} markers`
    );
}

// returns true if file is readable, false otherwise
function checkFile(path) {
    try {
        fs.accessSync(path,fs.constants.R_OK)
    } catch (error) {
        return false
    }
    return true
}

buildMarkers()