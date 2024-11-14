import type Graphic from "@arcgis/core/Graphic";

export class MapFeature {
    public name: string;
    public guid: string;
    public type: string;
    public graphic: Graphic
    public layerTitle: string;
    public order: number; // order of the feature in the list

    constructor(name: string, guid: string, type: string, graphic: Graphic, layerTitle: string, order: number) {
        this.name = name;
        this.guid = guid;
        this.type = type;
        this.graphic = graphic;
        this.layerTitle = layerTitle;
        this.order = order;
    }
}