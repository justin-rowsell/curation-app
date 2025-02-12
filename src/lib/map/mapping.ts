import { PUBLIC_STAGING_URL } from '$env/static/public';
import { getMuseum } from '$lib/stores/museum';
import type { Unsubscriber } from 'svelte/store';

interface MapApp {
  view?: any;
  savedExtent?: any;
}

const app: MapApp = {}

let unsubscribers: Unsubscriber[] = [];
let features: any[] = [];
let stagingLayer: __esri.FeatureLayer;
let featureTable: __esri.FeatureTable;
let stagingLayerView: __esri.FeatureLayerView;  
let highlightIds: number[] = [];
let highlightFeatures: __esri.Handle[] = [];
let jurisdictionGeometry: __esri.Polygon;
let Map: typeof __esri.Map, MapView: typeof __esri.MapView,
  Expand: typeof __esri.Expand, Search: typeof __esri.widgetsSearch, SearchSource: typeof __esri.SearchSource,
  FeatureLayer: any, GraphicsLayer: any, Sketch: any, Graphic: typeof __esri.Graphic, Geometry: typeof __esri.Geometry,
  IdentityManager: any, Point: typeof __esri.Point, FeaturTable: typeof __esri.FeatureTable, SketchViewModel: typeof __esri.SketchViewModel,
  geometryEngineAsync: typeof __esri.geometryEngineAsync, FeatureFilter: typeof __esri.FeatureFilter, FeatureEffect: typeof __esri.FeatureEffect,
  FeatureLayerView: typeof __esri.FeatureLayerView, jsonUtils: typeof __esri.jsonUtils, Polygon: typeof __esri.Polygon, 
  SimpleFillSymbol: typeof __esri.SimpleFillSymbol, Attachments: typeof __esri.Attachments;

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
  FeatureLayerView = (await import('@arcgis/core/views/layers/FeatureLayerView')).default;
  jsonUtils = (await import('@arcgis/core/geometry/support/jsonUtils.js'));
  Polygon = (await import('@arcgis/core/geometry/Polygon')).default;
  SimpleFillSymbol = (await import('@arcgis/core/symbols/SimpleFillSymbol')).default;
}

export async function init(container: HTMLDivElement, tableContainer: HTMLDivElement) {
  await loadArcGISModules(); ``

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

  stagingLayer = new FeatureLayer({
    url: PUBLIC_STAGING_URL,
    outFields: ["*"],
    visible: true,
    // Add popup template
    popupTemplate: {
      title: "Submission Details",
      content: getAttachmentsContent,
      outFields: ["*"]
    }
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
      // remove the graphics from the polygonGraphicsLayer
      polygonGraphicsLayer.removeAll();
    }
  });

  view.when(async () => {
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
        clearSelection();
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

  view.when(async () => {
    // loop through webmap's operational layers
    view.map.layers.forEach((layer, index) => {
      view
        .whenLayerView(layer)
        .then(async (layerView) => {
          if (layer.type === "feature") {
            // Add jurisdiction filter if provided
            const museum = await getMuseum();
            console.log("jurisdiction", museum);
            if (museum) {
              console.log("museum.geojson.geometry.coordinates[0]", museum.geojson.geometry.coordinates[0]);
              jurisdictionGeometry = new Polygon({
                spatialReference: { wkid: 4326 },
                rings: museum.geojson.geometry.coordinates[0]
              });

              // const graphic = new Graphic({
              //   geometry: jurisdictionGeometry,
              //   symbol: new SimpleFillSymbol({
              //     color: [0, 0, 0, 0.1],
              //     outline: {
              //       color: [0, 0, 0, 0.5],
              //       width: 1
              //     }
              //   })
              // });
              // polygonGraphicsLayer.add(graphic);

              console.log("jurisdictionGeometry", jurisdictionGeometry);
              const filter = new FeatureFilter({
                geometry: jurisdictionGeometry,
                spatialRelationship: "intersects"
              });
              console.log("filter", filter);

              (layerView as __esri.FeatureLayerView).filter = filter;
              featureTable.filterGeometry = jurisdictionGeometry.extent;
              stagingLayerView = layerView as __esri.FeatureLayerView;
            }
          }
        })
        .catch(console.error);
    });
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

function clearSelection() {
  console.log("clearing selection");
  featureTable.highlightIds.removeAll();
  for (let highlight of highlightFeatures) {
    highlight.remove();
  }

  // then we want to reset the feature table's filter to the original filter for museum jurisdiction
  featureTable.filterGeometry = jurisdictionGeometry.extent;
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
          clearSelection()
        } else {
          // filter the table based on the selection and only show those rows
          featureTable.filterGeometry = geometry;
          // Iterate through the features and push each individual result's OBJECTID to the highlightIds array
          results.features.forEach((feature) => {
            highlightIds.push(feature.attributes.__OBJECTID);
          });
          // Set the highlightIds array to the highlightIds property of the featureTable
          featureTable.highlightIds.addMany(highlightIds);

          // highlight the features
          for (let result of results.features) {
            let highlight = stagingLayerView.highlight(result);
            highlightFeatures.push(highlight);
          }
        }
      })
      .catch(errorCallback);
  }
}

function errorCallback(error: any) {
  console.log("error happened:", error.message);
}

async function getAttachmentsContent(feature: any) {
  console.log("getAttachmentsContent called with feature:", feature);
  const objectId = feature.graphic.attributes.objectid;
  console.log("ObjectID:", objectId);
  
  // Query attachments for this feature
  console.log("Querying attachments...");
  const attachmentQuery = await stagingLayer.queryAttachments({
    objectIds: [objectId]
  });
  console.log("Attachment query results:", attachmentQuery);

  // Create content element
  const contentDiv = document.createElement("div");
  
  // Add feature attributes section
  console.log("Creating attributes section");
  const attributesDiv = document.createElement("div");
  attributesDiv.style.marginBottom = "10px";
  // Add any relevant attributes you want to display
  attributesDiv.innerHTML = `
    <p><strong>ID:</strong> ${feature.graphic.attributes.objectid}</p>
    <p><strong>Description:</strong> ${feature.graphic.attributes.please_write_a_short_descriptio || 'N/A'}</p>
    <p><strong>Category:</strong> ${feature.graphic.attributes.what_category_best_applies_to_y || 'N/A'}</p>
    <p><strong>Photo Date:</strong> ${feature.graphic.attributes.when_was_your_photo_taken ? new Date(feature.graphic.attributes.when_was_your_photo_taken).toLocaleDateString() : 'N/A'}</p>
  `;
  contentDiv.appendChild(attributesDiv);

  // Add attachments section
  console.log("Creating attachments section");
  const attachmentsDiv = document.createElement("div");
  
  if (attachmentQuery[objectId] && attachmentQuery[objectId].length > 0) {
    const attachments = attachmentQuery[objectId];
    console.log("Found attachments:", attachments);
    
    attachments.forEach((attachment: any) => {
      console.log("Processing attachment:", attachment);
      if (attachment.contentType.startsWith('image/')) {
        console.log("Creating image element for:", attachment.url);
        const img = document.createElement("img");
        img.src = attachment.url;
        img.style.maxWidth = "100%";
        img.style.marginBottom = "10px";
        attachmentsDiv.appendChild(img);
      } else {
        console.log("Creating link for:", attachment.name);
        const link = document.createElement("a");
        link.href = attachment.url;
        link.target = "_blank";
        link.textContent = attachment.name;
        attachmentsDiv.appendChild(link);
        attachmentsDiv.appendChild(document.createElement("br"));
      }
    });
  } else {
    console.log("No attachments found");
    attachmentsDiv.textContent = "No attachments available";
  }
  
  contentDiv.appendChild(attachmentsDiv);
  
  console.log("Returning content div");
  return contentDiv;
}
