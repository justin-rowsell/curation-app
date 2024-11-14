export class MapCoords {
    constructor(lat: number = 0, lng: number = 0, wkid: number = 4326) {
        this.lat = lat;
        this.lng = lng;
        this.wkid = wkid;
    }

    public lat: number;
    public lng: number;
    public wkid: number = 4326;

    set(lat: number, lng: number, wkid: number = 4326) {
        this.lat = lat;
        this.lng = lng;
        this.wkid = wkid;
    }

    isNull() {
        return this.lat === 0 && this.lng === 0;
    }

}