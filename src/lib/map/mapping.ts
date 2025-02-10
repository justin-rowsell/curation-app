import { PUBLIC_STAGING_URL } from '$env/static/public';
import type { Unsubscriber } from 'svelte/store';

interface MapApp {
  view?: any;
  savedExtent?: any;
}

const app: MapApp = {}

let unsubscribers: Unsubscriber[] = [];
let features: any[] = [];
let stagingLayer: __esri.FeatureLayer;
let prodLayer: __esri.FeatureLayer;
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
    basemap: 'arcgis-light-gray'
  });

  const polygonGraphicsLayer = new GraphicsLayer();
  map.add(polygonGraphicsLayer);


  prodLayer = new FeatureLayer({
    url: PUBLIC_STAGING_URL,
    outFields: ["*"],
    visible: false,
  });
  map.add(prodLayer);
  stagingLayer = new FeatureLayer({
    url: PUBLIC_STAGING_URL,
    outFields: ["*"],
    visible: true,
  });
  map.add(stagingLayer);

  const view = new MapView({
    map,
    container,
    center: [-98.5795, 39.8283], // Center of the continental US
    zoom: 4 // Zoom level to show most of the US
  });

  featureTable = new FeaturTable({
    view,
    layer: stagingLayer,
    visibleElements: {
      menu: false,
      columnMenus: false
    },
    container: tableContainer,
    attachmentsEnabled: true,
    multiSortEnabled: true
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

    stagingLayer.featureEffect = new FeatureEffect({
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
      promoteButton.addEventListener("click", async () => {
        const confirmation = confirm("Are you sure you want to promote the selected submissions?");
        if (confirmation) {
          const selectedFeatures = await stagingLayer.queryFeatures({
            objectIds: features,
            outFields: ["*"]
          });
          console.log("adding features to prod layer", selectedFeatures.features);
          const edits = {
            addFeatures: selectedFeatures.features.map((feature: __esri.Graphic) => {
              return {
                geometry: feature.geometry,
                attributes: feature.attributes
              };
            })
          };
          await prodLayer.applyEdits(edits)

      //     // TODO - uncommented until the layers are set up correctly
      //     await stagingLayer.applyEdits({
      //       deleteFeatures: selectedFeatures.features.map((feature: __esri.Graphic) => {
      //         return {
      //           objectId: feature.attributes.__OBJECTID
      //         };
      //       })
      //     });

      //     featureTable.highlightIds.removeAll();
      //     features = [];
      //     alert("Selected submissions have been promoted.");
        }
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
  if (stagingLayer) {
    // create a query and set its geometry parameter to the
    // rectangle that was drawn on the view
    const query = {
      geometry: geometry,
      outFields: ["*"]
    };

    // query graphics from the csv layer view. Geometry set for the query
    // can be polygon for point features and only intersecting geometries are returned
    stagingLayer
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
