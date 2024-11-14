import { get, writable, type Writable } from 'svelte/store';
import { MapCoords } from './map-coords';
import type { MapFeature } from './map-feature';

export const mapCoords : Writable<MapCoords> = writable(new MapCoords());
export const coordToolActive : Writable<boolean> = writable(false);

export const sketchToolActive : Writable<boolean> = writable(false);
export const mapQueryResults : Writable<MapFeature[]> = writable([]);
export const removeFeature: Writable<MapFeature | null> = writable(null);

export const zoomToCoords: Writable<MapCoords | null> = writable(null);
export const zoomToMarket: Writable<string | null> = writable(null);

export function setCoords(lat: number, lng: number) {
    mapCoords.update(coords => {
        coords.set(lat, lng);
        return coords;
    });
}

export function setCoordToolActive(active: boolean) {
    coordToolActive.set(active);
}

export function activateSketchTool() {
    sketchToolActive.set(true);
}

export function completeSketch() {
    sketchToolActive.set(false);
}

export function setMapQueryResults(results: MapFeature[]) {
    mapQueryResults.set(results);
}

export function addToMapQueryResults(features: MapFeature[]) {
    mapQueryResults.update(results => {
        // Find the maximum order in the current list
        const maxOrder = Math.max(...results.map(result => result.order), 0);

        // we need to check for duplicate before adding using guid
        features.forEach((feature, index) => {
            if (!results.some(f => f.guid === feature.guid)) {
                // If order < 0, set it to the next sequential order number
                if (feature.order < 0) {
                    feature.order = maxOrder + index + 1;
                }
                results.push(feature);
            }
        });
        return results;
    });
}

export function removeFromMapQueryResults(feature: MapFeature) {
    mapQueryResults.update((results) => {
        // Filter out the feature to be removed
        const updatedResults = results.filter((result) => result.guid !== feature.guid);

        // Get the order of the removed feature
        const removedOrder = feature.order;

        // Update the order of the features that were further down the order than the removed feature
        updatedResults.forEach((result) => {
            if (result.order > removedOrder) {
                result.order--;
            }
        });

        return updatedResults;
    });

    // then add this feature to the removeFeatures list which we'll listen to from the mapping.ts class
    removeFeature.update(() => {
        return feature;
    });
}

export function clearMapQueryResults() {
    get(mapQueryResults).forEach((feature) => {
        removeFeature.update(() => {
            return feature;
        });
    });
    mapQueryResults.set([]);
}

export function setZoomToCoords(coords: MapCoords) {
    zoomToCoords.set(coords);
}

export function setZoomToMarket(market: string) {
    if (market !== 'Select one')
        zoomToMarket.set(market);
}
