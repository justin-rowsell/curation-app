import type { Unsubscriber } from 'svelte/store';

interface MapApp {
    view?: any;
    savedExtent?: any;
}

const app: MapApp = {}

let unsubscribers: Unsubscriber[] = [];
let features: any[] = [];
let climateActionsLayers: __esri.FeatureLayer;
let featureTable: __esri.FeatureTable;

let Map: typeof __esri.Map, MapView: typeof __esri.MapView,
    Expand: typeof __esri.Expand, Search: typeof __esri.widgetsSearch, SearchSource: typeof __esri.SearchSource,
    FeatureLayer: any, GraphicsLayer: any, Sketch: any, Graphic: typeof __esri.Graphic, Geometry: typeof __esri.Geometry,
    IdentityManager: any, Point: typeof __esri.Point, FeaturTable: typeof __esri.FeatureTable, SketchViewModel: typeof __esri.SketchViewModel,
    geometryEngineAsync: typeof __esri.geometryEngineAsync, FeatureFilter: typeof __esri.FeatureFilter, FeatureEffect: typeof __esri.FeatureEffect;

async function loadArcGISModules() {
    Map = (await import('@arcgis/core/Map')).default;
    MapView = (await import('@arcgis/core/views/MapView')).default;
    Expand = (await import('@arcgis/core/widgets/Expand')).default;
    Search = (await import('@arcgis/core/widgets/Search')).default;
    SearchSource = (await import('@arcgis/core/widgets/Search/SearchSource')).default;
    FeatureLayer = (await import('@arcgis/core/layers/FeatureLayer')).default;
    GraphicsLayer = (await import('@arcgis/core/layers/GraphicsLayer')).default;
    Sketch = (await import('@arcgis/core/widgets/Sketch')).default;
    Graphic = (await import('@arcgis/core/Graphic')).default;
    Geometry = (await import('@arcgis/core/geometry/Geometry')).default;
    IdentityManager = (await import('@arcgis/core/identity/IdentityManager')).default;
    Point = (await import('@arcgis/core/geometry/Point')).default;
    FeaturTable = (await import('@arcgis/core/widgets/FeatureTable')).default;
    SketchViewModel = (await import('@arcgis/core/widgets/Sketch/SketchViewModel')).default;
    geometryEngineAsync = (await import('@arcgis/core/geometry/geometryEngineAsync'));
    FeatureFilter = (await import('@arcgis/core/layers/support/FeatureFilter.js')).default;
    FeatureEffect = (await import('@arcgis/core/layers/support/FeatureEffect.js')).default;
}

export async function init(container: HTMLDivElement, tableContainer: HTMLDivElement) {
    await loadArcGISModules();

    const token = await generateCreds();
    const server = "https://www.arcgis.com/sharing/rest/";
    IdentityManager.registerToken({ server, token })

    if (app.view) {
        app.view.destroy()
    }

    const map = new Map({
        basemap: 'arcgis-light-gray',
    });

    const polygonGraphicsLayer = new GraphicsLayer();
    map.add(polygonGraphicsLayer);

    const view = new MapView({
        map,
        container
    });

    climateActionsLayers = new FeatureLayer({
        url: "https://services8.arcgis.com/d8Uf7TMrADof5TfI/arcgis/rest/services/survey123_8785997d024e4eb1b235816c7c344333_results/FeatureServer/0",
        outFields: ["*"],
        visible: true,
    });
    map.add(climateActionsLayers);

    featureTable = new FeaturTable({
        view,
        layer: climateActionsLayers,
        visibleElements: {
            menu: false,
            columnMenus: false
        },
        container: tableContainer
    });

    featureTable.highlightIds.on("change", async (event: any) => {
        // this array will keep track of selected feature objectIds to
        // sync the layerview feature effects and feature table selection
        // set excluded effect on the features that are not selected in the table
        event.removed.forEach((item: any) => {
            const data = features.find((data) => {
                return data === item;
            });
            if (data) {
                features.splice(features.indexOf(data), 1);
            }
        });

        // If the selection is added, push all added selections to array
        event.added.forEach((item: any) => {
            features.push(item);
        });

        climateActionsLayers.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({ objectIds: features }),
            excludedEffect: "@arcgis/core/layers/support/FeatureEffect.js"
        });
    });

    // create a new sketch view model set its layer
    const sketchViewModel = new SketchViewModel({
        view: view,
        layer: polygonGraphicsLayer
      });

      // Once user is done drawing a rectangle on the map
        // use the rectangle to select features on the map and table
        sketchViewModel.on("create", async (event) => {
            if (event.state === "complete") {
              // this polygon will be used to query features that intersect it
              const geometries = polygonGraphicsLayer.graphics.map(function (graphic: __esri.Graphic) {
                return graphic.geometry;
              });
              const queryGeometry = await geometryEngineAsync.union(geometries.toArray());
              selectFeatures(queryGeometry);
            }
          });

    view.when(async () => {
        const element = document.createElement('div');
        // add the select by rectangle button the view
        view.ui.add("select-by-rectangle", "top-left");
        const selectButton = document.getElementById("select-by-rectangle");
        if (selectButton) {
            // click event for the select by rectangle button
            selectButton.addEventListener("click", () => {
                view.closePopup();
                sketchViewModel.create("rectangle");
            });
        }

        // add the clear selection button the view
        view.ui.add("clear-selection", "top-left");
        const clearSelectionElement = document.getElementById("clear-selection");
        if (clearSelectionElement) {
            clearSelectionElement.addEventListener("click", () => {
                featureTable.highlightIds.removeAll();
                featureTable.filterGeometry.destroy;
                polygonGraphicsLayer.removeAll();
            });
        }

        view.ui.add("promote-button", "top-right")
        const promoteButton = document.getElementById("promote-button");
        if (promoteButton) {
            promoteButton.addEventListener("click", () => {
                alert("Are you sure you want to promote the selected submissions?")
            });
        }
    });


    app.view = view
    return cleanup;
}

function cleanup() {
    app.view?.destroy()
    for (let u of unsubscribers) {
        u();
    }
}


async function generateCreds(): Promise<string> {

    const response = await fetch('/token', {
        method: 'GET',
    });
    const json = await response.json();
    return json.access_token;
}

function selectFeatures(geometry: __esri.Geometry) {
    if (climateActionsLayers) {
      // create a query and set its geometry parameter to the
      // rectangle that was drawn on the view
      const query = {
        geometry: geometry,
        outFields: ["*"]
      };

      // query graphics from the csv layer view. Geometry set for the query
      // can be polygon for point features and only intersecting geometries are returned
      climateActionsLayers
        .queryFeatures(query)
        .then((results) => {
          if (results.features.length === 0) {
            // clearSelection()
          } else {
            featureTable.highlightIds.removeAll();
            let highlightIds: number[] = [];
            // filter the table based on the selection and only show those rows
            featureTable.filterGeometry = geometry;
            // Iterate through the features and push each individual result's OBJECTID to the highlightIds array
            results.features.forEach((feature) => {
              highlightIds.push(feature.attributes.__OBJECTID);
            });
            // Set the highlightIds array to the highlightIds property of the featureTable
            featureTable.highlightIds.addMany(highlightIds);
          }
        })
        .catch(errorCallback);
    }
  }

  function errorCallback(error: any) {
    console.log("error happened:", error.message);
  }
