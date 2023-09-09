
/*****************************************************************************
development2.js interface for 3d-force-graph
******************************************************************************/
// import {ForceGraphVR} from './3d-force-graph-vr.min.js';
// const graph = new ForceGraphVR();
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
const LABEL_RE = new RegExp('(?![^\\n]{1,' + LABEL_MAX_LINE_LENGTH + '}$)([^\\n]{1,' + LABEL_MAX_LINE_LENGTH + '})\\s', 'g');

// For BFO layout: -2000, .01, .011
// -30000 = normal.  negative=repulsion; positive=attraction // -2000 for BFO
const GRAPH_CHARGE_STRENGTH = -10000;

const GRAPH_LINK_HIGHLIGHT_RADIUS = 15;
const GRAPH_VELOCITY_DECAY = 0.4; // default 0.4
const GRAPH_ALPHA_DECAY = 0.0228; // default 0.0228
const GRAPH_NODE_RADIUS = 5;
//const GRAPH_COOLDOWN_TIME = 1500 // default 15000
//const GRAPH_COOLDOWN = 30000 // default 15000
const GRAPH_COOLDOWN_TICKS = 50; // default 15000
const ONTOLOGY_LOOKUP_URL = 'http://purl.obolibrary.org/obo/';
const CAMERA_DISTANCE = 300.0;

// Regular expression to match robot's markup triple explanation of
// unsatisfiable reasoning:
const RE_MD_TRIPLE = /\[(?<subject_label>[^\]]+)\]\((?<subject_uri>[^)]+)\) (?<relation>\w+) \[(?<object_label>[^\]]+)\]\((?<object_uri>[^)]+)\)/;
const RE_URL = /^https?:\/\/.+/i;
const RE_URL_ROOT = /^https?:\/\/[^#?]+/i;
const RE_NAMESPACE_URL = /(?<prefix>https?:\/\/.+[\/#](?<namespace>\w+)(?<separator>[_:]))(?<id>\w+)/;

/***************** DOM and APPEARANCE *****************/
const GRAPH_DOM_EL = $("#3d-graph");
const GRAPH_BACKGROUND_COLOR = "#102525";
// HACK for background sized to text; using 2nd semitransparent grey sprite as it always faces camera.
SPRITE_MAP = new THREE.TextureLoader().load( "img/whitebox.png" );
SPRITE_MATERIAL = new THREE.SpriteMaterial( { map: SPRITE_MAP, color: 0x808080 , opacity : 0.5} );
SPRITE_FONT_COLOR = '#FAEBD7';

const SYNONYM_FIELD = ["synonyms", 
  "oboInOwl:hasSynonym", 
  "oboInOwl:hasExactSynonym", 
  "oboInOwl:hasBroadSynonym", 
  "oboInOwl:hasNarrowSynonym", 
  "oboInOwl:hasRelatedSynonym"
]

// function load_graph(rawData) {
//   $(document.body).css({'cursor' : 'wait'});

//   top.Graph = ForceGraph3D({controlType: 'trackball'})(document.getElementById('3d-graph'))

//   // Using dfault D3 engine so we can pin nodes via { id: 0, fx: 0, fy: 0, fz: 0 }
//   .forceEngine('d3')
//   .d3Force('center', null)  // Enables us to add nodes without shifting centre of mass or having a centre attractor
//   //.d3Force('charge').strength(GRAPH_CHARGE_STRENGTH)
//   .width(GRAPH_DOM_EL.width())
//   .warmupTicks(0)
//   //.cooldownTime(GRAPH_COOLDOWN_TIME)
//   .cooldownTicks(GRAPH_COOLDOWN_TICKS)
//   .backgroundColor(GRAPH_BACKGROUND_COLOR)

//   // Getter/setter for the simulation intensity decay parameter, only 
//   // applicable if using the d3 simulation engine.  
//   .d3AlphaDecay(GRAPH_ALPHA_DECAY) // default 0.0228
  
//   // Getter/setter for the nodes' velocity decay that simulates the medium
//   // resistance, only applicable if using the d3 simulation engine.
//   .d3VelocityDecay(GRAPH_VELOCITY_DECAY)  // default 0.4

//   // IS THERE A WAY TO FORCE CAMERA TO only pan, and rotate on x,y but not Z ?
//   .cameraPosition({x:0, y:0, z: 3000 },{x:0, y:0, z: 0 })
//   //.linkWidth(link => link === highlightLink ? 4 : 1)
//   .linkWidth(function(link) {
//     // 
//     return link.highlight ? GRAPH_LINK_HIGHLIGHT_RADIUS : link.width > GRAPH_LINK_WIDTH ? link.width : GRAPH_LINK_WIDTH
//   })
//   // It would be great if we could make it dashed instead
//   .linkColor(function(link) {
//     return link.highlight ? link.highlight : link.color
//   })

//   .linkResolution(3) // 3 sided, i.e. triangular beam
//   .linkOpacity(1)

//   //.nodeAutoColorBy('color')
//   // Note d.target is an object!
//   /*.linkAutoColorBy(d => d.target.color})*/

//   // Text shown on mouseover.  WAS node.label
//   .nodeLabel(node => `<div>${node['rdfs:label']}<br/><span class="tooltip-id">${node.id}</span></div>`) 

//   //.nodeColor(node => node.highlight ? 'color) // Note: this triggers refresh on each animation cycle
//   //.nodeColor(node => highlightNodes.indexOf(node) === -1 ? 'rgba(0,255,255,0.6)' : 'rgb(255,0,0,1)')
//   //.nodeColor(node => node.highlight ? '#F00' : node.color ) 
  
//   // Not doing anything...
//   .nodeRelSize(node => node.highlight ? 18 : 4 ) // 4 is default
//   .onNodeHover(node => GRAPH_DOM_EL[0].style.cursor = node ? 'pointer' : null)
//   .onLinkClick(link => {node_focus(link.target)})
//   .onNodeClick(node => node_focus(node))
//   .nodeThreeObject(node => render_node(node))

//   top.rawData = rawData
//   node_focus()

//   // Usual case for GEEM ontofetch.py ontology term specification table:
//   data = init_ontofetch_data(rawData)
//   init_search(data) 

//   var request = new XMLHttpRequest();
//   request.open("GET", "../data/trees/agro_nodes.json", false);
//   request.send(null)
//   var nodes = JSON.parse(request.responseText);
  
//   var request = new XMLHttpRequest();
//   request.open("GET", "../data/trees/agro_links.json", false);
//   request.send(null)
//   var links = JSON.parse(request.responseText);

//   $("#status").html(top.builtData.nodes.length + " terms");

//   // Chop the data into two parts so first pulls most upper level categories into position.
//   //var tempQ = top.RENDER_QUICKER
//   //var tempL = top.RENDER_LABELS
//   top.RENDER_QUICKER = false
//   top.RENDER_LABELS = true

//   top.Graph
//     //.linkDirectionalParticles(0)
//     .d3Force('center', null)
//     .d3Force('charge').strength(GRAPH_CHARGE_STRENGTH)

//   Graph.graphData({nodes:nodes, links:links})

//   $(document.body).css({'cursor' : 'default'});

// }

function getJSON(path) {
  return fetch(path).then(response => response.text());
}

function load_graph() {

  if (top.RAW_DATA) {
    // Rendering of all but last pass skips labels and fancy polygons.
    top.RENDER_QUICKER = true;
    top.RENDER_LABELS = true;

    $(document.body).css({'cursor': 'wait'});

    setNodeReport(); // Clear out sidebar info

    const cache_url = $("select#ontology option").filter(':selected')[0].dataset.cache

    var request = new XMLHttpRequest();
    request.open('GET', cache_url, false);
    request.send(null);
    let snapshot = JSON.parse(request.responseText);

    top.BUILT_DATA = init_ontofetch_data(top.RAW_DATA, cache=snapshot['nodes']);
    top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length-1].depth;
    init_search(top.BUILT_DATA);
    let nodes=top.BUILT_DATA.nodes;
    let links=top.BUILT_DATA.links;
    top.GRAPH = init(load=true, nodes, links);
    apply_changes();
    // console.dir("a-entity");
    // var aEntity = document.querySelector("a-entity");
    // const t = document.querySelector("a-entity[camera], a-camera").setAttribute('position', {x: 100, y: 5, z: 0});
    top.dataLookup = Object.fromEntries(nodes.map(e => [e.id, e]))

    $(document.body).css({'cursor' : 'default'});
    $("#download_button").css({'visibility': 'visible'})
    $("#rerender_button").css({'visibility': 'visible'})
  }
}

function load_uploaded_graph() {

  // Rendering of all but last pass skips labels and fancy polygons.
  top.RENDER_QUICKER = true;
  top.RENDER_LABELS = true;

  $(document.body).css({'cursor': 'wait'});

  setNodeReport(); // Clear out sidebar info

  // ISSUE: top.METADATA_JSON is never adjusted???!??!
  top.BUILT_DATA = init_ontofetch_data(top.METADATA_JSON);

  top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length-1].depth;
  init_search(top.BUILT_DATA);
  let nodes=top.NODES_JSON;
  let links=top.LINKS_JSON
  top.GRAPH = init(load=true, nodes, links);
  
  top.dataLookup = Object.fromEntries(nodes.map(e => [e.id, e]))

  $(document.body).css({'cursor' : 'default'});
  $("#download_button").css({'visibility': 'visible'})
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

    $(document.body).css({'cursor' : 'wait'});

    setNodeReport(); // Clear out sidebar info

    // Usual case for GEEM ontofetch.py ontology term specification table:
    // This creates top.BUILT_DATA
    top.BUILT_DATA = init_ontofetch_data(top.RAW_DATA);
    $("#status").html(top.BUILT_DATA.nodes.length + " terms");
    top.MAX_DEPTH = top.BUILT_DATA.nodes[top.BUILT_DATA.nodes.length-1].depth;
    init_search(top.BUILT_DATA);

    // top.GRAPH = init(load=false);

    $("#download_button").css({'visibility': 'visible'})
    $("#rerender_button").css({'visibility': 'visible'})
  }
};


function init(load=false, nodes=null, links=null) {

  if (top.GRAPH) {
    // See bottom of https://github.com/vasturiano/3d-force-graph/issues/302
    // See bottom of https://github.com/vasturiano/3d-force-graph/issues/433
    top.GRAPH._destructor()
  }

  // controlType is  'fly', 'orbit' or 'trackball' 

  if (load) {

    return ForceGraphVR({controlType: 'fly'})(GRAPH_DOM_EL[0])

    .graphData({nodes: nodes, links: links})

    // Using dfault D3 engine so we can pin nodes via { id: 0, fx: 0, fy: 0, fz: 0 }
    .forceEngine('d3')
    // .enableNodeDrag(false) // Stops frozen nodes from getting moved around by user
    .d3Force('center', null)  // Enables us to add nodes without shifting centre of mass or having a centre attractor
    .width(GRAPH_DOM_EL.width())
    .warmupTicks(0)
    //.cooldownTime(GRAPH_COOLDOWN_TIME)
    .cooldownTicks(0)
    .backgroundColor(GRAPH_BACKGROUND_COLOR)

    // Getter/setter for the simulation intensity decay parameter, only 
    // applicable if using the d3 simulation engine.  
    .d3AlphaDecay(GRAPH_ALPHA_DECAY) // default 0.0228
    
    // Getter/setter for the nodes' velocity decay that simulates the medium
    // resistance, only applicable if using the d3 simulation engine.
    // .d3VelocityDecay(GRAPH_VELOCITY_DECAY)  // default 0.4

    // IS THERE A WAY TO FORCE CAMERA TO only pan, and rotate on x,y but not Z ?
    // .cameraPosition({x:0, y:-4000, z: 2000 }, {x:0, y:0, z: 0 })
    //.linkWidth(link => link === highlightLink ? 4 : 1)
    .linkWidth(function(link) {
      // 
      return link.highlight ? GRAPH_LINK_HIGHLIGHT_RADIUS : link.width > GRAPH_LINK_WIDTH ? link.width : GRAPH_LINK_WIDTH
    })
    // .linkWidth(4)

    // Note d.target is an object!
    /*.linkAutoColorBy(d => d.target.color})*/
    // It would be great if we could make it dashed instead
    // First mark a link by its highlight if any;
    // then by group's color if top.RENDER_ULO_EDGE;
    // then by color.

    // PROBLEM: sometimes target is node, sometimes string.
    // CAREFUL! THIS ITERATES AND SEEMS TO CHANGE NODE source / target
    // from id to object.
    .linkColor(function(link) {
      var target = link.target;

      if (link.highlight_color)
        return link.highlight_color;

      // only happens on post-first-render, so link.target established as object
      if (top.RENDER_ULO_EDGE === true) {

        var group = top.dataLookup[link.target.group_id];
        if (group && group.color) {
          return group.color;
        };
      }

      //link.target itself is actually string id on first pass.
      if (!link.target.prefix) {
        // convert to object
        target = top.dataLookup[link.target];
      }

      // used for ULO as ontology color when not rendering by ULO branch color
      if (target.prefix == 'BFO') {
        return getOntologyColor(top.dataLookup[target.id]);
      }

      return target.color;
    })

    .linkResolution(3) // 3 sided, i.e. triangular beam
    .linkOpacity(1)

    // Text shown on mouseover.  WAS node.label
    // .nodeLabel(node => `<div>${node['rdfs:label']}<br/><span class="tooltip-id">${node.id}</span></div>`) 

    //.nodeAutoColorBy('color')
    //.nodeColor(node => node.highlight ? 'color) // Note: this triggers refresh on each animation cycle
    //.nodeColor(node => highlightNodes.indexOf(node) === -1 ? 'rgba(0,255,255,0.6)' : 'rgb(255,0,0,1)')
    //.nodeColor(node => node.highlight ? '#F00' : node.color ) 
    
    // Not doing anything...
    .nodeRelSize(node => node.highlight ? 18 : 4 ) // 4 is default
    .onNodeHover(node => nodeHoverVR(node))
    // .onLinkClick(link => {setNodeReport(link.target)})
    .onNodeClick(node => nodeClickVR(node))
    .nodeThreeObject(node => render_node(node))

    // Do this only for 3d iterated version
    // Running on each iteration?
    .onEngineStop(stuff => {
      depth_iterate();
    })
  }

  else {
    return ForceGraphVR({controlType: 'fly'})(GRAPH_DOM_EL[0])

    // Using dfault D3 engine so we can pin nodes via { id: 0, fx: 0, fy: 0, fz: 0 }
    .forceEngine('d3')
    // .enableNodeDrag(false) // Stops frozen nodes from getting moved around by user
    .d3Force('center', null)  // Enables us to add nodes without shifting centre of mass or having a centre attractor
    .width(GRAPH_DOM_EL.width())
    .warmupTicks(0)
    //.cooldownTime(GRAPH_COOLDOWN_TIME)
    .cooldownTicks(GRAPH_COOLDOWN_TICKS)
    .backgroundColor(GRAPH_BACKGROUND_COLOR)

    // Getter/setter for the simulation intensity decay parameter, only 
    // applicable if using the d3 simulation engine.  
    .d3AlphaDecay(GRAPH_ALPHA_DECAY) // default 0.0228
    
    // Getter/setter for the nodes' velocity decay that simulates the medium
    // resistance, only applicable if using the d3 simulation engine.
    .d3VelocityDecay(GRAPH_VELOCITY_DECAY)  // default 0.4

    // IS THERE A WAY TO FORCE CAMERA TO only pan, and rotate on x,y but not Z ?
    // .cameraPosition({x:0, y:-4000, z: 2000 }, {x:0, y:0, z: 0 })
    //.linkWidth(link => link === highlightLink ? 4 : 1)
    .linkWidth(function(link) {
      // 
      return link.highlight ? GRAPH_LINK_HIGHLIGHT_RADIUS : link.width > GRAPH_LINK_WIDTH ? link.width : GRAPH_LINK_WIDTH
    })
    .linkHeight(4)
    // Note d.target is an object!
    /*.linkAutoColorBy(d => d.target.color})*/
    // It would be great if we could make it dashed instead
    // First mark a link by its highlight if any;
    // then by group's color if top.RENDER_ULO_EDGE;
    // then by color.

    // PROBLEM: sometimes target is node, sometimes string.
    // CAREFUL! THIS ITERATES AND SEEMS TO CHANGE NODE source / target
    // from id to object.
    .linkColor(function(link) {
      var target = link.target;

      if (link.highlight_color)
        return link.highlight_color;

      // only happens on post-first-render, so link.target established as object
      if (top.RENDER_ULO_EDGE === true) {

        var group = top.dataLookup[link.target.group_id];
        if (group && group.color) {
          return group.color;
        };
      }

      //link.target itself is actually string id on first pass.
      if (!link.target.prefix) {
        // convert to object
        target = top.dataLookup[link.target];
      }

      // used for ULO as ontology color when not rendering by ULO branch color
      if (target.prefix == 'BFO') {
        return getOntologyColor(top.dataLookup[target.id]);
      }

      return target.color;
    })

    .linkResolution(3) // 3 sided, i.e. triangular beam
    .linkOpacity(1)

    // Text shown on mouseover.  WAS node.label
    // .nodeLabel(node => `<div>${node['rdfs:label']}<br/><span class="tooltip-id">${node.id}</span></div>`) 

    //.nodeAutoColorBy('color')
    //.nodeColor(node => node.highlight ? 'color) // Note: this triggers refresh on each animation cycle
    //.nodeColor(node => highlightNodes.indexOf(node) === -1 ? 'rgba(0,255,255,0.6)' : 'rgb(255,0,0,1)')
    //.nodeColor(node => node.highlight ? '#F00' : node.color ) 
    
    // Not doing anything...
    .nodeRelSize(node => node.highlight ? 18 : 4 ) // 4 is default
    // .onNodeHover(node => GRAPH_DOM_EL[0].style.cursor = node ? 'pointer' : null)
    // .onLinkClick(link => {setNodeReport(link.target)})
    // .onNodeClick(node => setNodeReport(node))
    .nodeThreeObject(node => render_node(node))

    // Do this only for 3d iterated version
    // Running on each iteration?
    .onEngineStop(stuff => {
      depth_iterate();
    })

  }

  var container = document.getElementById("a-entity");

}


function depth_iterate() {
  /*
  Handles one iteration at depth n at a time.
  On≠ each iteration, adds all nodes at that depth, and any connections to
  parents that they have.
  Only on top.EXIT_DEPTH iteration are labels rendered, thicker edges,
  and switch to given dimension.

  */
  if (top.ITERATE > top.EXIT_DEPTH) {
    if (top.GRAPH) {
      // const graphInstance = top.GRAPH();
      // console.log(graphInstance);
      // graphInstance.pauseAnimation();
      // top.GRAPH.ForceGraphVR.pauseAnimation();
    }
    return
  }

  // Convert all parent node flex coordinates to fixed ones.
  for (item in top.NEW_NODES) {
    var node = top.NEW_NODES[item];

    // If it doesn't have to move any more because it has no kids,
    // then fix its position; it therefore get taken out of "cooldown" list
    // Thus speeding calculation
    if (node.children.length == 0) {
      node.fy = node.y;
      node.fx = node.x;
    }

    const parent = top.dataLookup[node.parent_id];
    if (parent) {
      parent.fx = parent.x;
      parent.fy = parent.y;
      // fix parent z
      if (RENDER_SLICES && !(node.id in top.layout))
        node.fx = parent.fx;
    }

    if (GRAPH_DIMENSIONS == 2 && !(node.id in top.layout))
       node.fz = lookup_2d_z(node)+ 30

  }

  if (top.ITERATE < top.EXIT_DEPTH && top.ITERATE != top.MAX_DEPTH && top.ITERATE < top.RENDER_DEPTH) {

    top.GRAPH.d3Force('charge')
      .strength(GRAPH_CHARGE_STRENGTH/(top.ITERATE*top.ITERATE) )

    top.NEW_NODES = top.BUILT_DATA.nodes
      .filter(n => n.depth == top.ITERATE)

    if (top.NEW_NODES.length) {

      // freeze z coordinate
      for (item in top.NEW_NODES) {
        node = top.NEW_NODES[item]

        const parent = top.dataLookup[node.parent_id];

        // depth temporarily set close to parent so that it temporarily acts as antagonist 

        if (parent && GRAPH_DIMENSIONS == 2 && !(node.id in top.layout)) {
         // node.fz = lookup_2d_z(node) - 100
          node.fz = node_depth(node)
        }
        else
          node.fz = node_depth(node)
        /* can't set node.x, y on new nodes. */
      }

      // RENDER_OTHER_PARENTS ISSUE: Old note: "link with otherparent getting added by target depth BUT other parent not in nodes yet". Caused by new OWL format functionality?  For RENDER_OTHER_PARENTS to work, we need to check that .links includes "l.other = true" for any node's link pointing to node["rdfs:subClassOf"] that isn't in node.parent_id.
      var newLinks = top.BUILT_DATA.links.filter(
        l => top.dataLookup[l.target] 
        && top.dataLookup[l.target].depth == top.ITERATE
        && l.other === false
        );


      const { nodes, links } = top.GRAPH.graphData();

      // Customize how many force matrix iterations it takes before rendering this iteration and moving on
      top.GRAPH.cooldownTicks(top.NEW_NODES.length < 40 ? 5 + top.NEW_NODES.length / 2 : 40)
      //GRAPH.cooldownTicks((top.NEW_NODES.length+30))


      $("#status").html('Rendering ' + (nodes.length + newLinks.length) + ' of ' + top.BUILT_DATA.nodes.length + " terms, depth " + top.ITERATE);

      // Only positions of new nodes are recalculated
      top.GRAPH.graphData({
        nodes: nodes.concat(top.NEW_NODES), // [...nodes, ...newNodes],
        links: links.concat(newLinks) //  [...links, ...newLinks]
      });


    }
    top.ITERATE ++;
  }

  else {
    // Does all remaining nodes past iteration depth limit at once
    depth_iterate_exit();
    $(document.body).css({'cursor' : 'default'});
    // Triggers update of RENDER_LABELS flag, and renders all nodes accordingly
    top.GRAPH.refresh();
  }
 
}

function depth_iterate_exit() {

  // Final step: Flip into requested (2 or 3) dimensions, with parents fixed by their 2d (x, y) 
  console.log(' Ending with' + GRAPH_DIMENSIONS + ',' + top.ITERATE + ',' + top.MAX_DEPTH + top.RENDER_DEPTH)

  // Restores these settings after quick positional render without them.
  var flag = $("#render_labels:checked").length == 1

  // Issue: with latest 3d-force-graph this flag is only causing 
  // labels of last iteration to be drawn. Graph as a whole isn't being
  // redrawn on exit.
  if (top.RENDER_LABELS != flag) {
    top.RENDER_LABELS = flag
  }
  var flag = $("#render_quicker:checked").length == 1
  if (top.RENDER_QUICKER != flag) {
    top.RENDER_QUICKER = flag
  }
  //top.GRAPH.numDimensions(GRAPH_DIMENSIONS)



  // top.GRAPH.d3Force('charge').strength(-100 ) // 
  // z coordinate reset to standard hierarchy
  for (item in top.BUILT_DATA.nodes) {
    node = top.BUILT_DATA.nodes[item]
    // This reduces crowdedness of labelling, otherwise labels are all on
    // same plane.
    // if (GRAPH_DIMENSIONS == 2 && (node.id in top.layout)) {
    if (GRAPH_DIMENSIONS == 2) {
      node.fz = 0  //lookup_2d_z(node)
    }
    else {
      const z_randomizer = Math.random() * 20 - 10
      node.fz = node_depth(node) + z_randomizer
    }

    // No need to have this node participate in force directed graph now.
    if (node.children.length == 0) {
      node.fy = node.y;
      node.fx = node.x;
    }

    const parent = top.dataLookup[node.parent_id];
    if (parent && RENDER_SLICES && !(node.id in top.layout))
      node.fx = parent.fx;

  }
  // don't make below var newNodes / var newLinks?
  var newNodes = top.BUILT_DATA.nodes.filter(n => n.depth.within(top.ITERATE, top.RENDER_DEPTH))

  // Return link if target is within depth, or link is one of the "other, i.e. secondary links.
  var newLinks = top.BUILT_DATA.links.filter(
    l => top.dataLookup[l.target] && ((RENDER_OTHER_PARENTS && l.other === true) 
      || (l.other === false && top.dataLookup[l.target].depth.within(top.ITERATE, top.RENDER_DEPTH))
    )
  );    
  /*
  // For some reason, can't code abovce as  .filter(l => function(l){...}) ?
  var newLinks = top.BUILT_DATA.links.filter( l => function(l){
    target = top.dataLookup[l.target]
    // Return link if target is within depth, or link is one of the "other, i.e. secondary links.
    // 
    return (RENDER_OTHER_PARENTS && l.other ===true) || ((l.other === false) && target.depth >= top.ITERATE && target.depth <= top.RENDER_DEPTH)
  });
  */
 
  // Fetches existing tuple of nodes and links
  const { nodes, links } = top.GRAPH.graphData();

  const new_length = nodes.length + newNodes.length
  $("#status").html('Rendering ' + new_length + ' of ' + top.BUILT_DATA.nodes.length + " terms, depth >= " + (top.ITERATE || 1));

  //top.GRAPH.cooldownTicks(new_length)  // GRAPH_COOLDOWN_TICKS * 3

  top.GRAPH.graphData({
    nodes: nodes.concat(newNodes),
    links: links.concat(newLinks)
  });

  // Ensures no more iterations
  top.ITERATE = top.EXIT_DEPTH+1;


  return; // End of it all.

} 

function lookup_2d_z(node) {
  // apply this to parent, not to a node that is being calculated.
  var parent = top.dataLookup[node.parent_id];
  // ISSUE: fixing node to parent z is causing pythagorean distance in force directed graph to screw up,
  // causing points to contract to centre.
  if (parent) {
    console.log ("z", parent.z)
    return (parent.z - 10.0)
  }
  return node_depth(node)
}

Number.prototype.within = function(a, b) {
  var min = Math.min.apply(Math, [a, b]),
      max = Math.max.apply(Math, [a, b]);
  return this >= min && this <= max;
};

function apply_changes() {
  fix_z = fix_z - 100;
  const scene = document.querySelector("a-scene");
  // document.getElementById("forcegraph").setAttribute('position', '100 0.59 100')
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
  move.setAttribute("haptics", "");
  console.log(move.components["gamepad-controls"]);
  // const dialogEntity = document.createElement('a-entity');
  // dialogEntity.setAttribute('dialog-popup','')
  // dialogEntity.setAttribute('position', '0 0 -5')
  // camera.appendChild(dialogEntity)
  const controllers = document.querySelectorAll("a-entity[laser-controls]");
  controllers.forEach((controller) => {
    //   console.log(controller);
    controller.setAttribute("haptics", "");
    controller.setAttribute("remove-hud", "");
    controller.setAttribute("search-popup", "");
  });

  /* helper for vasturiano/3d-force-graph-vr
   *			draw a sphere around each force graph node, to make it easy to point to them with the ray caster,
   * 			and attach a text label (which rotates to always face the camera)
   * after the graph has been created, use something like
   *			fgEl.setAttribute('spherize', {})
   * to create the spheres
   */
  const fg = t.getAttribute("forcegraph");
  const spheresEntity = document.createElement("a-entity");

  AFRAME.registerComponent("spherize", {
    schema: {},
    dependencies: ["forcegraph"],
    init: function () {
      // spheres are cached here and re-used
      this.spheres = new Map();
    },
    tick: function (time, timeDelta) {
      // const controllers = document.querySelectorAll("a-entity[laser-controls]");
      // console.log(controllers[0].getAttribute('laser-controls'));
      document.querySelectorAll("a-entity[raycaster]").forEach((child) => {
        // console.log(child.getAttribute('raycaster'));
        child.setAttribute("raycaster", {
          objects: "[forcegraph], .collidable",
          // direction: "0 -1 0",
        });
      });
      document
        .querySelector("[forcegraph]")
        .components.forcegraph.forceGraph.children.forEach((child) => {
          if (child.type == "Mesh" && child.__data.id) {
            let sphereEl = this.spheres.get(child.__data.id);
            if (sphereEl) {
              // reuse existing sphere and label, but change its position

              sphereEl.object3D.position.copy(child.position);
              sphereEl.setAttribute("color", child.__data.color);
            } else {
              sphereEl = document.createElement("a-entity");
              sphereEl.classList.add("node");
              sphereEl.id = child.__data.id;
              this.spheres.set(child.__data.id, sphereEl);
              let radius = child.__data.radius;
              child.__data.radius = 5 * radius;
              // sphereEl.setAttribute("radius", radius - 0.1);
              sphereEl.setAttribute("position", child.position);

              let color = child.__data.color || "white";
              let compColor = "white";
              sphereEl.setAttribute("color", color);
              this.el.appendChild(sphereEl);
              let label = document.createElement("a-entity");
              let originalText = child.__data.short_label;
              let splitText =
                originalText.length > 9
                  ? originalText.substring(0, 8) +
                    "\n" +
                    originalText.substring(9)
                  : originalText;
              let totalWidth = originalText.length * ((radius * 400) / 160);
              let totalHeight = 2 * ((radius * 400) / 160);
              let labelBackground = document.createElement("a-entity");
              labelBackground.setAttribute("geometry", {
                primitive: "plane",
                width: totalWidth,
                height: totalHeight,
              });
              labelBackground.setAttribute("material", {
                color: "gray",
                opacity: 0.5,
              });
              labelBackground.setAttribute("position", { x: 0, y: 1, z: -1 });

              label.setAttribute("text", {
                value: originalText,
                color: compColor,
                width: radius * 400,
                align: "center",
                wrapCount: 160,
              });
              // label.setAttribute('scale', '4 4 4');
              // label.appendChild(labelBackground);
              sphereEl.setAttribute("look-at", "#camera");
              label.setAttribute("position", {
                x: 0,
                y: 5 * radius,
                z: 5 * radius,
              });
              sphereEl.appendChild(label);
            }
          }
          // const s = (document.querySelector('a-sphere'));
          // s.setAttribute('radius', "10");
        });
    },
  });
  spheresEntity.setAttribute("spherize", "");
  scene.appendChild(spheresEntity);
  // const fg = t.getAttribute('forcegraph');

  t.setAttribute("position", "0 0 -2000");
  t.setAttribute("rotation", "270 0 0");
  // const c = document.querySelector("a-entity[wasd-controls]");
  // c.setAttribute('acceleration', 300);
  const r = document.querySelector("a-entity[raycaster]");
  r.setAttribute("raycaster", {
    objects: "[forcegraph], .collidable",
    direction: "0 0 -1",
  });

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
@param source node
@param target node
@param radius integer
@param label string [of node, not used]
@parap color: string Highlight color of link
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

    /*
    else // Is this working at all? Doesn't seem like it.
      if (node.parent_id) {
        var parent = top.dataLookup[node.parent_id]
        if (parent && parent.x !== undefined) {
          node.x = parent.x +  parseInt(Math.random() * 20-10)
          node.y = parent.y +  parseInt(Math.random() * 20-10)
        }
      }
  */
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

function render_node(node) {
  // Displays semi-sphere, then overlays with label text
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
      // alternate parents may not be in current node graph
      /* else {
        parent_uris.push('unrecognized: ' + parent_id)
      } */
    }
  }
  return parent_uris.length ? parent_uris.join(", ") : null;
}

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
    // Color assigned here but rendered color isn't actually affected until
    // AFTER next rebuild of graph/viewport.
    node.color = "red";

    // This sets visual color directly in rendering engine so we don't have to
    // rerender graph as a whole!
    if (node.marker && node.marker.material) {
      node.marker.material.color.setHex(0xff0000);
      // node.
      if (node.depth > 2) {
        // node.marker.scale.x = 3;
        // node.marker.scale.y = 3;
        //node.marker.scale.z = 3
      }
    }
  }
}