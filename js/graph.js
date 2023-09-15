/*****************************************************************************
graph.js
Initialises the graph and contains functions for updating and manipulation post rendering
******************************************************************************/
var RENDER_QUICKER = false;
var RENDER_DEPTH = 50;
var RENDER_GALAXY = false;
var RENDER_DEPRECATED = false;
var RENDER_LABELS = true;
var RENDER_ULO_EDGE = false;
var RENDER_OTHER_PARENTS = false;
var GRAPH_DIMENSIONS = 3;
var GRAPH_LINK_WIDTH = 3;
var GRAPH_NODE_DEPTH = 100; // 100
var RENDER_SLICES = false;

var EXIT_DEPTH = 26;
// Label text is cut after first word ending before this character limit.
const LABEL_MAX_LINE_LENGTH = 30;
const LABEL_RE = new RegExp(
  "(?![^\\n]{1," +
    LABEL_MAX_LINE_LENGTH +
    "}$)([^\\n]{1," +
    LABEL_MAX_LINE_LENGTH +
    "})\\s",
  "g"
);

const GRAPH_CHARGE_STRENGTH = -10000;

const GRAPH_LINK_HIGHLIGHT_RADIUS = 15;
const GRAPH_VELOCITY_DECAY = 0.4; // default 0.4
const GRAPH_ALPHA_DECAY = 0.0228; // default 0.0228
const GRAPH_NODE_RADIUS = 5;
const GRAPH_COOLDOWN_TICKS = 50; // default 15000
const ONTOLOGY_LOOKUP_URL = "http://purl.obolibrary.org/obo/";
const CAMERA_DISTANCE = 300.0;

// Regular expression to match robot's markup triple explanation of
// unsatisfiable reasoning:
const RE_MD_TRIPLE =
  /\[(?<subject_label>[^\]]+)\]\((?<subject_uri>[^)]+)\) (?<relation>\w+) \[(?<object_label>[^\]]+)\]\((?<object_uri>[^)]+)\)/;
const RE_URL = /^https?:\/\/.+/i;
const RE_URL_ROOT = /^https?:\/\/[^#?]+/i;
const RE_NAMESPACE_URL =
  /(?<prefix>https?:\/\/.+[\/#](?<namespace>\w+)(?<separator>[_:]))(?<id>\w+)/;

/***************** DOM and APPEARANCE *****************/
const GRAPH_DOM_EL = $("#3d-graph");
const GRAPH_BACKGROUND_COLOR = "#102525";
// HACK for background sized to text; using 2nd semitransparent grey sprite as it always faces camera.
SPRITE_MAP = new THREE.TextureLoader().load("img/whitebox.png");
SPRITE_MATERIAL = new THREE.SpriteMaterial({
  map: SPRITE_MAP,
  color: 0x808080,
  opacity: 0.5,
});
SPRITE_FONT_COLOR = "#FAEBD7";

const SYNONYM_FIELD = [
  "synonyms",
  "oboInOwl:hasSynonym",
  "oboInOwl:hasExactSynonym",
  "oboInOwl:hasBroadSynonym",
  "oboInOwl:hasNarrowSynonym",
  "oboInOwl:hasRelatedSynonym",
];

function getJSON(path) {
  return fetch(path).then((response) => response.text());
}

function load_graph() {
  if (top.RAW_DATA) {
    // Rendering of all but last pass skips labels and fancy polygons.
    top.RENDER_QUICKER = true;
    top.RENDER_LABELS = true;

    $(document.body).css({ cursor: "wait" });

    setNodeReport(); // Clear out sidebar info

    const cache_url = $("select#ontology option").filter(":selected")[0].dataset
      .cache;

    var request = new XMLHttpRequest();
    request.open("GET", cache_url, false);
    request.send(null);
    let snapshot = JSON.parse(request.responseText);

    top.BUILT_DATA = init_ontofetch_data(
      top.RAW_DATA,
      (cache = snapshot["nodes"])
    );
    top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length - 1].depth;
    init_search(top.BUILT_DATA);
    let nodes = top.BUILT_DATA.nodes;
    let links = top.BUILT_DATA.links;
    top.GRAPH = init((load = true), nodes, links);
    apply_changes();
    top.dataLookup = Object.fromEntries(nodes.map((e) => [e.id, e]));

    $(document.body).css({ cursor: "default" });
    $("#download_button").css({ visibility: "visible" });
    $("#rerender_button").css({ visibility: "visible" });
  }
}

function load_uploaded_graph() {
  // Rendering of all but last pass skips labels and fancy polygons.
  top.RENDER_QUICKER = true;
  top.RENDER_LABELS = true;

  $(document.body).css({ cursor: "wait" });

  setNodeReport(); // Clear out sidebar info

  // ISSUE: top.METADATA_JSON is never adjusted???!??!
  top.BUILT_DATA = init_ontofetch_data(top.METADATA_JSON);

  top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length - 1].depth;
  init_search(top.BUILT_DATA);
  let nodes = top.NODES_JSON;
  let links = top.LINKS_JSON;
  top.GRAPH = init((load = true), nodes, links);

  top.dataLookup = Object.fromEntries(nodes.map((e) => [e.id, e]));

  $(document.body).css({ cursor: "default" });
  $("#download_button").css({ visibility: "visible" });
}

/*
  Main method for loading a new data file and rendering a graph of it.
*/
function do_graph() {
  if (top.RAW_DATA) {
    // Rendering of all but last pass skips labels and fancy polygons.
    top.RENDER_QUICKER = true;
    top.RENDER_LABELS = true;
    top.NEW_NODES = []; // global so depth_iterate can see it
    top.ITERATE = 1;

    $(document.body).css({ cursor: "wait" });

    setNodeReport(); // Clear out sidebar info

    // Usual case for GEEM ontofetch.py ontology term specification table:
    // This creates top.BUILT_DATA
    top.BUILT_DATA = init_ontofetch_data(top.RAW_DATA);
    $("#status").html(top.BUILT_DATA.nodes.length + " terms");
    top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length - 1].depth;
    init_search(top.BUILT_DATA);

    $("#download_button").css({ visibility: "visible" });
    $("#rerender_button").css({ visibility: "visible" });
  }
}

function init(load = false, nodes = null, links = null) {
  if (top.GRAPH) {
    // See bottom of https://github.com/vasturiano/3d-force-graph/issues/302
    // See bottom of https://github.com/vasturiano/3d-force-graph/issues/433
    top.GRAPH._destructor();
  }

  // controlType is  'fly', 'orbit' or 'trackball'

  if (load) {
    return (
      ForceGraphVR({ controlType: "fly" })(GRAPH_DOM_EL[0])

        .graphData({ nodes: nodes, links: links })

        // Using dfault D3 engine so we can pin nodes via { id: 0, fx: 0, fy: 0, fz: 0 }
        .forceEngine("d3")
        .d3Force("center", null) // Enables us to add nodes without shifting centre of mass or having a centre attractor
        .width(GRAPH_DOM_EL.width())
        .warmupTicks(0)
        .cooldownTicks(0)
        .backgroundColor(GRAPH_BACKGROUND_COLOR)

        // Getter/setter for the simulation intensity decay parameter
        .d3AlphaDecay(GRAPH_ALPHA_DECAY) // default 0.0228

        .linkWidth(function (link) {
          //
          return link.highlight
            ? GRAPH_LINK_HIGHLIGHT_RADIUS
            : link.width > GRAPH_LINK_WIDTH
            ? link.width
            : GRAPH_LINK_WIDTH;
        })

        .linkColor(function (link) {
          var target = link.target;

          if (link.highlight_color) return link.highlight_color;

          // only happens on post-first-render, so link.target established as object
          if (top.RENDER_ULO_EDGE === true) {
            var group = top.dataLookup[link.target.group_id];
            if (group && group.color) {
              return group.color;
            }
          }

          //link.target itself is actually string id on first pass.
          if (!link.target.prefix) {
            // convert to object
            target = top.dataLookup[link.target];
          }

          // used for ULO as ontology color when not rendering by ULO branch color
          if (target.prefix == "BFO") {
            return getOntologyColor(top.dataLookup[target.id]);
          }

          return target.color;
        })

        .linkResolution(3) // 3 sided, i.e. triangular beam
        .linkOpacity(1)

        .nodeRelSize((node) => (node.highlight ? 18 : 4)) // 4 is default
        .onNodeClick((node) => nodeClickVR(node))
        .nodeThreeObject((node) => render_node(node))
    );
  }
}

Number.prototype.within = function (a, b) {
  var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
  return this >= min && this <= max;
};

//Function to apply changes to the graph post render. This is due to 3D Force Graph VR reserving access to A-Frame initialisation.
function apply_changes() {
  const scene = document.querySelector("a-scene");

  const t = document.querySelector("a-entity[forcegraph]");
  t.setAttribute("class", "clickable");
  const rig = document.querySelector("a-entity");
  rig.setAttribute("id", "cameraRig");
  const camera = document.querySelector("[camera]");
  camera.setAttribute("id", "camera");
  const move = document.querySelector("[movement-controls]");
  move.setAttribute("gamepad-controls", {
    enabled: true,
  });
  const controllers = document.querySelectorAll("a-entity[laser-controls]");
  controllers.forEach((controller) => {
    controller.setAttribute("remove-hud", "");
    controller.setAttribute("search-popup", "");
  });

  const spheresEntity = document.createElement("a-entity");
  spheresEntity.setAttribute("spherize", "");
  scene.appendChild(spheresEntity);

  const r = document.querySelector("a-entity[raycaster]");
  r.setAttribute("raycaster", {
    objects: "[forcegraph], .collidable",
    direction: "0 0 -1",
  });

  t.setAttribute("position", "0 0 -2000");
  t.setAttribute("rotation", "270 0 0");
  spheresEntity.setAttribute("position", "0 0 -2000");
  spheresEntity.setAttribute("rotation", "270 0 0");
}

function init_ontofetch_data(rawData, cache = null) {
  /*
  This is a 2 pass algorithm.
  
  1st pass: Establish node depth and label, and color based on node prefix.
  2nd pass: Establish links and adjust according to parent node depth.

  INPUT
    rawData.term: Array of nodes

  */

  top.dataLookup = {};
  top.linkLookup = {};

  let data = { nodes: [], links: [] };

  if (!rawData) return data;

  // 1st pass does all the nodes.
  for (var item in rawData.term) {
    let node = rawData.term[item];

    if (!node["owl:deprecated"] || RENDER_DEPRECATED) {
      try {
        if (cache != null) {
          let cached_node = cache.filter((obj) => {
            return obj.id == item;
          })[0];

          node.x = cached_node.x;
          node.y = cached_node.y;
          node.z = cached_node.z;
        }
      } catch {
        console.log("Warning: A node is undefined");
      }

      node.children = [];
      node.color = null;
      node.depth = 0;
      node.group_id = null;
      node.prefix = get_term_prefix(node.id);
      set_node_label(node);
      data.nodes.push(node);
      top.dataLookup[node.id] = node;

      let ancestors = [node];
      let focus = node;
      while (focus.parent_id) {
        if (focus.id == focus.parent_id) {
          console.log("ERROR: ontology term has itself as parent:" + focus.id);
          focus.depth = 1;
          break;
        }
        if (!rawData.term[focus.parent_id]) {
          focus.depth = 1;
          break;
        }

        focus = rawData.term[focus.parent_id];

        if (focus.depth) {
          // already calculated depth.
          break;
        }
        if (!focus.parent_id) {
          focus.depth = 1;
          break;
        }
        ancestors.push(focus);
      }
      // focus now has depth to convey to all ancestors
      // Ancestors are in reverse order, from shallowest to deepest.
      // Bizarrely, ptr is a string if using "(ptr in ancestors)" !
      for (var ptr = 0; ptr < ancestors.length; ptr++) {
        // Don't use ancestor = ancestors.pop(); seems to intefere with data.nodes ???
        let ancestor = ancestors[ancestors.length - ptr - 1];
        ancestor.depth = focus.depth + ptr + 1;
      }
    }
  }

  // To support the idea that graph can work on top-level nodes first
  data.nodes.sort(function (a, b) {
    return a.depth - b.depth;
  });

  // If custom render depth chosen, chop nodes deeper than that.
  if (RENDER_DEPTH != 50) {
    data.nodes = data.nodes.filter((n) => n.depth <= RENDER_DEPTH);
  }

  // Establish lookup table for all nodes
  data.nodes.forEach((n, idx) => {
    top.dataLookup[n.id] = n;
  });

  // 2nd pass does LINKS organized by depth, i.e. allowing inheritance of properties:
  for (let item in data.nodes) {
    let node = data.nodes[item];
    // Size node according to proximity to depth 0.
    node.radius = Math.pow(2, 7 - node.depth); // # of levels

    // Any node which has a layout record including custom color, gets group_id = itself.
    if (top.layout[node.id] && top.layout[node.id].color) {
      node.group_id = node.id;

      // Color by layout overrides all
      let layout_group = top.layout[node.id];
      if (layout_group.color) {
        node.color = top.colors[layout_group.color];
      }
    }

    // Otherwise node.group is inherited from parent
    if (node.parent_id) {
      const parent = top.dataLookup[node.parent_id];
      if (parent) {
        if (!node.group_id && parent.group_id) {
          node.group_id = parent.group_id;
        }
        set_link(data.links, parent, node, node.radius);
      }
    }

    // Color by ontology
    if (node.color === null) {
      node.color = getOntologyColor(node);
    }
  }

  if (RENDER_DEPTH != 50) {
    // Chop link content off by depth that user specified.
    // top.dataLookup only has nodes included in graph to given depth at this point.
    data.links = data.links.filter(
      (l) => top.dataLookup[l.source] && top.dataLookup[l.target]
    );
  }

  data.nodes = preposition_nodes(data.nodes);

  set_legend(data);

  return data;
}

function getOntologyColor(node) {
  //performs a lookup of matching ontologies to predefined colors
  var prefix = get_term_prefix(node.id);
  if (prefix in prefix_color_mapping) {
    let colorImlooking = colors[prefix_color_mapping[prefix].color];
    return colorImlooking;
  }

  console.log("Missing color for ontology prefix " + prefix + " in " + node.id);
  return "red";
}

function set_node_label(node) {
  /* Makes a clipped short_label for long labels.
  Also ensures id is shown if term has no rdfs:label
  */
  var label = node["rdfs:label"]; // was node.label
  if (label) {
    // label derived from node's first few words ...
    node.short_label = label.replace(LABEL_RE, "$1*");
    if (node.short_label.indexOf("*") > 0)
      node.short_label = node.short_label.split("*", 1)[0] + " ...";
  } else {
    node.label = node.id;
    node.short_label = node.id;
  }
}

/* Creates a new link in given links array
*/
function set_link(
  links,
  source,
  target,
  radius,
  label = "",
  color = null,
  other = false
) {
  // Issue: after this is rendered, seems to switch source,target to objects?
  var link = {
    source: source.id,
    target: target.id,
    label: label,
    highlight_color: color, // Hex or string
    width: radius,
    other: other,
  };

  links.push(link);
  top.dataLookup[source.id].children.push(target.id);
  top.linkLookup[source.id + "-" + target.id] = link;

  return link;
}

function get_node_radius(node, fancyLayout) {
  /*
  Vary node radius by depth from root of structure.
  */
  if (node.highlight) return 20;
  if (node.radius > GRAPH_NODE_RADIUS) return node.radius;
  return GRAPH_NODE_RADIUS;
}

function preposition_nodes(nodes) {
  /* 
  Force graph begins dynamics normally by randomly placing nodes, but 
  this leads to challenging situations where nodes are not even remotely 
  where they should be - and their edge attraction can't get them back
  to local context.
  */
  for (var item in nodes) {
    var node = nodes[item];

    if (!RENDER_GALAXY)
      // Initially fix all nodes
      node.fz = node_depth(node);

    // Give initial x,y hint based on parents
    var layout_node = top.layout[node.id];
    if (layout_node) {
      node.fz = node_depth(node);
      node.fx = layout_node.x;
      node.x = layout_node.x;
      node.fy = layout_node.y;
      node.y = layout_node.y;
    }
  }
  return nodes;
}

function node_depth(node) {
  /*
  Returns depth tier calculated as 1000 - depth of node from top of hierarchy in 
  GRAPH_NODE_DEPTH increments, but with first 6 levels having a power relation
  So 0:1024, 1:512, 2:256, 3:128, 4:64, 5: -100, 6: -200, 7: -300 etc.
  */
  base = node.depth < 11 ? 2 ** (10 - node.depth) : 0;
  return base - (node.depth - 4) * GRAPH_NODE_DEPTH;
}

//Creates the 3D object to be used for the graph
function render_node(node) {
  var group = new THREE.Group();
  var fancyLayout = layout[node.id] || !RENDER_QUICKER;
  var nodeRadius = get_node_radius(node, fancyLayout);

  var geometry = new THREE.SphereGeometry(nodeRadius / 2, 24, 16, 0); // (nodeRadius, 6, 4, 0, Math.PI) does 1/2 sphere
  var material = new THREE.MeshBasicMaterial({ color: node.color });
  var circle = new THREE.Mesh(geometry, material);
  circle.position.set(0, 0, 0);
  group.add(circle);
  node.marker = circle;
  return circle;
}

function get_term_prefix(entity_id) {
  return entity_id ? entity_id.split(":")[0].split("#")[0] : null;
}

function lookup_url(term_id, label) {
  /* Returns HTML link of full "native" term URI, as well as OLS link.
   */

  if (!label) label = top.dataLookup[term_id].label;

  var ols_lookup_URL = null;
  // If no prefix, then whole term_id returned, and its probably a URI
  var prefix = get_term_prefix(term_id);
  if (prefix == term_id) {
    var term_url = term_id;
  } else {
    // A prefix was recognized
    ols_lookup_URL = `https://www.ebi.ac.uk/ols/ontologies/${prefix}/terms?iri=`;
    term_url = top.RAW_DATA["@context"][prefix];
    if (!term_url) {
      term_url = ONTOLOGY_LOOKUP_URL;
    }
    term_url = term_url + term_id.split(/[:#]/)[1];
  }

  return (
    `<a href="${term_url}" target="_term">${label}</a>` +
    (ols_lookup_URL
      ? `, <a href="${ols_lookup_URL}${term_url}" target="_term">OLS</a> `
      : "")
  );
}

function get_term_id_urls(parent_list) {
  /* Gets HTML link list of all parents so one can click on them to navigate.
  */
  var parent_uris = [];
  if (parent_list) {
    for (ptr in parent_list) {
      const parent_id = parent_list[ptr];
      var parent = top.dataLookup[parent_id];
      if (parent) {
        if (parent["rdfs:label"]) parent_label = parent["rdfs:label"];
        else parent_label = parent_id;
        parent_uris.push(
          `<span class="focus" onclick="setNodeReport(top.dataLookup['${parent_id}'])">${parent_label}</span>`
        );
      }
    }
  }
  return parent_uris.length ? parent_uris.join(", ") : null;
}

//Handler for node selection
function nodeClickVR(node = {}) {
  //First make all nodes return to original colour
  if (node) {
    if (document.querySelector("#nodeHUD")) {
      document
        .querySelector("[forcegraph]")
        .components.forcegraph.data.nodes.forEach((node) => {
          const col = getOntologyColor(node);
          const numericColor = parseInt(col.substring(1), 16);
          node.marker.material.color.setHex(numericColor);
          node.color = col;
        });
      //clear the HUD
      const HUDel = document.querySelector("#nodeHUD");
      HUDel.parentNode.removeChild(HUDel);
    }
    //Creating the HUD
    const camera = document.querySelector("#camera");
    const nodeHUD = document.createElement("a-entity");
    const header = document.createElement("a-entity");
    const body = document.createElement("a-entity");
    const parents = document.createElement("a-entity");
    const children = document.createElement("a-entity");

    nodeHUD.setAttribute("id", "nodeHUD");
    nodeHUD.setAttribute("class", "clickable"); //make the node interactable with the raycaster

    nodeHUD.setAttribute("geometry", {
      primitive: "plane",
      height: 2.5,
      width: 2.5,
    });
    nodeHUD.setAttribute("material", {
      color: "gray",
      opacity: 0.5,
    });
    header.setAttribute("text", {
      value: node.id + "\n" + node["rdfs:label"],
      align: "center",
      baseline: "top",
      width: 2.5,
    });
    header.setAttribute("position", "0 1 0");

    body.setAttribute("text", {
      value: node.marker.__data["IAO:0000115"],
      align: "justify",
      width: 2.5,
    });
    const parent_id = node.parent_id;
    const parent = top.dataLookup[parent_id];
    const parent_label = parent ? parent["rdfs:label"] : parent_id;
    parents.setAttribute("text", {
      value: "Parent: " + parent_label,
      align: "left",
      width: 2.5,
      anchor: "left",
    });
    parents.setAttribute("position", "-1 -1 0");
    children.setAttribute("text", {
      value: node.parentNode,
      align: "right",
      width: 2.5,
      anchor: "left",
    });
    nodeHUD.appendChild(header);
    nodeHUD.appendChild(body);
    nodeHUD.appendChild(parents);
    nodeHUD.appendChild(children);
    nodeHUD.setAttribute("position", "-1 0 -5");
    nodeHUD.setAttribute("look-at", "#camera");
    camera.appendChild(nodeHUD);
    //change the node color to red
    node.color = "red";
    if (node.marker && node.marker.material) {
      node.marker.material.color.setHex(0xff0000);
    }
  }
}

/*Clears the graph of any current nodes selected, then searches the graph
 for the query term and highlights the node in red*/
function highlite_node(query) {
  let nodesArray = this.BUILT_DATA.nodes;
  document.querySelector("[forcegraph]").components.forcegraph.data.nodes;
  for (let node = 0; node < nodesArray.length; node++) {
    if (nodesArray[node]["rdfs:label"] === query) {
      nodesArray[node].marker.material.color.setHex(0xff0000);
      return;
    }
  }
}
