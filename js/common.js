
/*****************************************************************************
common.js interface for 3d-force-graph

Functions to drive 3d-force-graph that are core.  More experimental stuff is
in other files like development.js .  These files are loaded in addition to
/js/bundle.js , which is created by node.js's browserify command.

Work with rdflib.js is documented via:
  https://solid.inrupt.com/docs/manipulating-ld-with-rdflib

This program can work directly off of .owl files in RDF/XML format. They can
be stored locally in the /data folder, or provided in a URL

_____________________________
Node.js NPM Management:

  To update 3d-force-graph run this in ontotrek root folder:
  
  > npm update 

  To update /js/bundle.js which needs latest 3d-force-graph, need to run 
  browserify.org's "browserify" command. To load it (may need sudo su):

  > npm install -g browserify
  > npm install uniq 

  Then in /js folder, regenerate bundle.js based on super-basic index.js

  > browserify index.js -o bundle.js

  Now the catch is the latest 3d-force-graph isn't browserifying due to some
  ES5 / 6 browserify issue.

  So retrieve a copy of 3d-force-graph.min.js directly from /unpkg.com/3d-force-graph

_____________________________
Development notes:

Graph parameters
  https://github.com/vasturiano/3d-force-graph

Force node position with:
  https://github.com/vasturiano/3d-force-graph/issues/90

Also see link hovering:
  https://github.com/vasturiano/3d-force-graph/issues/14

See forcing link size:
  https://github.com/d3/d3-force#forceLink

_____________________________
The Ontology Json File Format

A legacy JSON format data file can also be supplied in /data/ is generated 
by ontofetch.py from an OWL ontology file.  This is being phased out.

Example fetchs of ontology using "ontofetch.py" program. 
It returns a flat json list of terms branching from given root (defaults 
to owl:Entity). No option currently to retrieve all terms - terms must have
a single root.

  python ontofetch.py http://purl.obolibrary.org/obo/bfo/2.0/bfo.owl -o data -r http://purl.obolibrary.org/obo/BFO_0000001
  python ontofetch.py https://raw.githubusercontent.com/obi-ontology/obi/master/obi.owl -o data
  python ontofetch.py https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/master/src/ontology/doid-merged.owl -o data
  python ontofetch.py https://raw.githubusercontent.com/obophenotype/human-phenotype-ontology/master/hp.owl -o data -r http://purl.obolibrary.org/obo/UPHENO_0001001
  python ontofetch.py https://raw.githubusercontent.com/AgriculturalSemantics/agro/master/agro.owl -o data
  python ontofetch.py https://raw.githubusercontent.com/arpcard/aro/master/aro.owl -o test -r http://purl.obolibrary.org/obo/ARO_1000001
  python ontofetch.py https://raw.githubusercontent.com/EBISPOT/ancestro/master/hancestro.owl -o test -r http://purl.obolibrary.org/obo/HANCESTRO_0004
  python ontofetch.py https://raw.githubusercontent.com/pato-ontology/pato/master/pato.owl -o test -r http://purl.obolibrary.org/obo/PATO_0000001
  python ontofetch.py https://raw.githubusercontent.com/PopulationAndCommunityOntology/pco/master/pco.owl -o test

  Note this misses 2 branches:
  python ontofetch.py https://raw.githubusercontent.com/Planteome/plant-ontology/master/po.owl -o test -r http://purl.obolibrary.org/obo/PO_0025131
  python ontofetch.py https://raw.githubusercontent.com/CLO-ontology/CLO/master/src/ontology/clo_merged.owl -o test -r http://purl.obolibrary.org/obo/BFO_0000001
  python ontofetch.py http://purl.obolibrary.org/obo/cmo.owl -o test -r http://purl.obolibrary.org/obo/CMO_0000000
  python ontofetch.py https://raw.githubusercontent.com/evidenceontology/evidenceontology/master/eco.owl -o test -r http://purl.obolibrary.org/obo/BFO_0000001
  python ~/GitHub/GEEM/scripts/ontofetch.py https://raw.githubusercontent.com/biobanking/biobanking/master/ontology/obib.owl

  python3 ../ontofetch/ontofetch.py http://www.onto-med.de/ontologies/gfo.owl -o data/ -r http://www.onto-med.de/ontologies/gfo.owl#Entity,http://www.onto-med.de/ontologies/gfo.owl#Material_persistant

  python3 ../ontofetch/ontofetch.py http://purl.obolibrary.org/obo/ma.owl -o data/ -r http://purl.obolibrary.org/obo/MA_0000001

  PROBLEM CASE: Many terms, little class/subclass structure
  python3 ../ontofetch/ontofetch.py https://raw.githubusercontent.com/obophenotype/mouse-anatomy-ontology/master/emapa.owl -o data/ -r http://purl.obolibrary.org/obo/EMAPA_0

******************************************************************************/


init_search();
init_interface();
let fix_z = -100; 
$(document).foundation();



// Try this in case URL had path, before chosen() is applied 
var auto_load = document.location.href.indexOf('?ontology=')
if (auto_load) {
    var choice = document.location.href.substr(auto_load+10).toLowerCase()
    $("#ontology").children(`option[value="data/${choice}.json"]`).attr("selected","selected");
    $("#ontology").trigger('change')
}

// Saves an object as a JSON
function save(blob, filename) {
  var link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Helper function to save nodes/links as JSON
function saveString(text, filename) {

  save(new Blob([text], { type: 'text/plain' }), filename);

}


function init_interface() {
  // Selection list of all node labels allows user to zoom in on one
  $("#ontology")
    .on('change', function(item){
      if (this.value > '') {
        const cache_url = $("select#ontology option").filter(':selected')[0].dataset.cache;

        var request = new XMLHttpRequest();
        request.open('GET', cache_url, false);
        request.send();
        if (request.status == 404) {
          load_data(this.value, do_graph);
        }
        else {
          load_data(this.value, load_graph);
        }
      }
    })

  $("#ontology").chosen({placeholder_text_single: 'Select an item ...'})

  // Allows user to re-render the ontology instead of loading up a snapshot
  $("#rerender_button").on('click', function(item){
    do_graph();
  })

  // Allows the user to download JSONs for the nodes and links of the ontology
  $("#download_button").on('click', function(item){
    const { nodes, links } = top.GRAPH.graphData();
    const nodes_out = nodes.map(({id, x, y, z}) => ({id, x, y, z}));

    for (i = 0; i < nodes_out.length; i++) {
      nodes_out[i].x = parseInt(nodes_out[i].x, 10);
      nodes_out[i].y = parseInt(nodes_out[i].y, 10);
      nodes_out[i].z = parseInt(nodes_out[i].z, 10);
    }

    const out_obj = {
      'nodes': nodes_out,
      // 'meta': top.RAW_DATA
    };
    saveString(JSON.stringify(out_obj), 'cache.json');
  })

  // Selection list of all node labels allows user to zoom in on one
  $("#label_search").on('change', function(item){
    if (this.value != '')
      setNodeReport(top.dataLookup[this.value])
  })

  $("#upload_cache").on('change', function(event) {
    var reader = new FileReader();

    reader.onload = function(event) {
      top.NODES_JSON = JSON.parse(event.target.result);
    }

    reader.readAsText(event.target.files[0]);
  })

  // Uploads JSON cache file
  $("#upload_json_button").on('click', function(item){
    const cache_url = $("#upload_cache").val();
    const onto_url = $("#ontology_url").val();
    const url_ok = RE_URL.exec(onto_url);

    if (!url_ok) {
      alert(`The ontology URL: "${onto_url}" is not valid`);
    }

    if (cache_url > '' && url_ok) {
      try {
        load_uploaded_graph();
      }
      catch (err) {
        alert("Something is wrong with either the URL or the cache file. Ensure that the URL is pointing directly to an owl rdf/xml file and that the cache file corresponds to the correct ontology. " + err.message);
        data = null;
      }
    }
  })

  //$("#ontology_url").on('change', function(item) {
  //  alert("Fetching: " + this.value)
  //  get_ontology(this.value)
  //})

  $("#ontology_url_button").on('click', function(item) {
    const url = $("#ontology_url").val()
    const url_ok = RE_URL.exec(url)
    if (url_ok)
      try {
        load_data(url, do_graph);
      }
      catch (err) {
          alert("URL fetch didn't work. Note, URL must point directly to an owl rdf/xml file.  It can't be redirected to another location: " + err.message)
          data = null;
      }
    else
      alert(`The ontology URL: "${url}" is not valid`)
  })

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_deprecated").on('change', function(item) {
    RENDER_DEPRECATED = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  })

  // upper level ontology edge coloring
  $("input[name='ulo_edge_coloring']").on('click', function(item) {
    RENDER_ULO_EDGE = (this.value == 'true');
    $('#ulo_legend').toggle(RENDER_ULO_EDGE);
    $('#ontology_legend').toggle(!RENDER_ULO_EDGE);

    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  })

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_slices").on('change', function(item) {
    RENDER_SLICES = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  })

  $("#thickness_control").on('change', function(item) {
    GRAPH_LINK_WIDTH = parseFloat(this.value)
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  })

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_quicker").on('change', function(item) {
    RENDER_QUICKER = this.checked
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  })

  $("#render_labels").on('change', function(item) {
    RENDER_LABELS = this.checked
    top.GRAPH.refresh();
  })

  /* With new OWL format this functionality broke.
  $("#render_other_parents").on('change', function(item) {
    RENDER_OTHER_PARENTS = this.checked;
    do_graph();
    // FUTURE: Just toggle visibility via WEBGL
  })
  */

  $("#render_dimensions").on('change', function(item) {
    GRAPH_DIMENSIONS = parseInt(this.value)
    if (top.GRAPH) {
      // It appears iterative algorithm doesn't work with num dimensions
      // because it fixes x,y,z of parent nodes.  Must switch to alternate
      // rendering algorithm, or relax x,y,z for nodes below a certain depth.
      top.GRAPH.numDimensions(GRAPH_DIMENSIONS);
      do_graph();

    }
  })

  $("#render_layer_depth").on('change', function(item) {
    GRAPH_NODE_DEPTH = parseInt(this.value)
    do_graph();
  })

  /* / Galaxy or hierarchic view
  $("#render_galaxy").on('change', function(item) {
    RENDER_GALAXY = this.checked
    if (top.GRAPH) {
      let { nodes, links } = top.GRAPH.graphData();
      for (item in nodes) {
        var node = nodes[item]
        if (!top.layout[node.id]) {
          if (RENDER_GALAXY) { // release z position.
            node.fz = null  
          }
          else // reestablish z hierarchy
            node.fz = node_depth(node);
        }
      }
      top.GRAPH.graphData({"nodes":nodes, "links":links})
    }
    })*/

  // Controls depth of nodes being rendered.
  $("#depth_control").on('change', function(item) {
    RENDER_DEPTH = parseInt(this.value)
    do_graph();
  })

  // Selection list of all node labels allows user to zoom in on one
  $("#select_child").on('change', function(item){
    if (this.value != '')
      setNodeReport(top.dataLookup[this.value])
  })

  // Trace works on ROBOT "explain" Markdown format report.
  $("#trace_button").on('click', function(item){
    var trace_content = $('#trace_content').val().trim()
    if (trace_content != '') {

      // DisjointWith node to focus on in analysis, if any.
      var focus = null 

      var content = trace_content.split('\n')
      // Set up these arrays to catch any new nodes or links not existing in current graph
      var new_nodes = []
      var new_links = []

      for (ptr in content) {

        var result = triple_parse(content[ptr])

        if (result) {

          var subject_node = get_node_from_url(new_nodes, result.subject_uri, result.subject_label)
          var object_node = get_node_from_url(new_nodes, result.object_uri, result.object_label)

          if (subject_node && object_node)
            switch (result.relation) {

              case 'DisjointWith':
                // Find shared parent class/node of both those nodes 
                // - that is where disjointness is defined?
                //alert(source_id + " disjoint with " + target_id)

                link = get_link(new_links, subject_node, object_node, 20, result.relation, 0xFF0000); // RED
                // Set Focus here
                link.highlight = 0xFF0000;
                focus = subject_node;
                break;

              case 'SubClassOf': 
                link = get_link(new_links, object_node, subject_node, 10, result.relation, 0xFFA500); // Orange
                link.highlight = 0xFFA500;
                break;                 
            }
        }
      }

      // There are new node or links to add
      if (new_nodes.length || new_links.length) {
        const { nodes, links } = top.GRAPH.graphData();
        nodes.push(...new_nodes);
        links.push(...new_links);
        top.GRAPH.graphData({'nodes': nodes,'links': links});

      }

      top.GRAPH.refresh();// Trigger update of 3d objects in scene

      if (focus)
        setNodeReport()
    }
    var AEntity = document.getElementById("a-entity");
  })
}


/************************** CONTRADICTION REPORTING ***************************/

function triple_parse (line) {
  /* This is for the superimposition of unsatisfiability explanations provided
  by OWLAPI. Ontotrek provides a short instruction about how to get these via
  the command line https://robot.obolibrary.org/ tool. These explanations come
  in the form of a list of [subject] [relation] [object] triples which have 
  at least one triple that is causing unsatisfiability.
  
  Here we use a regular expression to find markdown expressions of 
  [subject relation object] tripe and return a dictionary of each element.
  
  INPUT: a text line hopefully of Markdown format representation of a triple
  generated by the "robot" program (https://robot.obolibrary.org/). Example 
  line:

    "- [geopolitical region](http://semanticscience.org/resource/SIO_000415) SubClassOf [designated area on Earth](http://purl.obolibrary.org/obo/GENEPIO_0001886)"

  OUTPUT: A dictionary key values in pattern of:

    { object_label: "immaterial entity"
      object_uri: "http://purl.obolibrary.org/obo/BFO_0000141"
      relation: "DisjointWith"
      subject_label: "material entity"
      subject_uri: "http://purl.obolibrary.org/obo/BFO_0000040"
    }
  
  */

  var matchObj = RE_MD_TRIPLE.exec(line);
  if (matchObj)
    return matchObj.groups

  //console.log("line", line, "regex", matchObj)
  return null
}


function get_node_from_url(new_nodes, url, label) {
  /*  RE_NAMESPACE_URL on ontology term URL returns dictionary {
    prefix: "http://purl.obolibrary.org/obo/BFO_",
    namespace: "BFO",
    id: 123456}
  */
  const re_node = RE_NAMESPACE_URL.exec(url)
  if (re_node) {
    groups = re_node.groups
    node_id = groups.namespace + ':' + groups.id
    var node = top.dataLookup[node_id]
    if (!node) {
      node = make_node(new_nodes, node_id, label)
    }
    node.highlight = true;
    return node
  }
  
  console.log("Problem parsing:", url)
  return node
}

function make_node(new_nodes, node_id, label) {
  // Used in Markdown to triple conversion
  // FUTURE: Code z-axis based on depth call.
  node = {
    'id':             node_id,
    'rdfs:label':     label,
    'rdfs:subClassOf': [],
    'parent_id':      null,
    'group_id':       null,
    'IAO:0000115':    '',
    'color':          '#FFF', // Default color by ontology
    'depth':          4, // Initializes a bigger but not giant label
    'children':       []
  };
  new_nodes.push(node);
  top.dataLookup[node.id] = node;
  return node
}

function get_link(new_links, source, target, radius, label, highlight_color) {
  /* Highlights link between source_id node and target_id node.
  Makes a link if one doesn't exist and adds to new_links.
  */

  var link = top.linkLookup[`${source.id}-${target.id}`]
  if (!link) {
    link = set_link(new_links, source, target, radius, label, highlight_color);
  }
  return link
  /* This is direct access code to link that has already been entered into
  graph. Issue with direct access is THREE is reusing material definitions as 
  objects on creation. Can't set color of individual materials.  Seems to
  be a different story for nodes which are individually created materials.
  if (link.__lineObj) {
    link.__lineObj.material.color.setHex(hex_color)
    link.__lineObj.scale.x = 2
    link.__lineObj.scale.y = 2
    link.__lineObj.scale.z = 2
  }
  */

}


function highlite_node(node, hex_color = 0xFF0000) {
  /* Emphasize node in red directly in rendering engine. Sticks to current
  build of graph.
  */

  /* Works temporarily until next top.GRAPH.Refresh()
  if (node && node.marker.material) {

    node.marker.material.color.setHex(hex_color);  // e.g. 0xFF0000
    node.marker.scale.x = 3
    node.marker.scale.y = 3
    node.marker.scale.z = 3
    //console.log(node)
  }
  */
  return node
}


function load_data(URL, callback) {
  /*
    Fetch json data file that represents simplified .owl ontology
    OR owl file in rdf/xml format 
  */

  var xhttp = new XMLHttpRequest();
  //Access-Control-Allow-Origin
  //* header value 
  // FOR WEBSERVER???
  var json_file_type = URL.toLowerCase().indexOf('json') > 0;
  if (json_file_type)
    xhttp.overrideMimeType("application/json");
  else
    xhttp.overrideMimeType("rdf/xml");

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          if (json_file_type) {
            // CONVERSION JSON data to work with new OWL format
            var data = JSON.parse(this.responseText)

            Object.keys(data.specifications).forEach(function(id) {
              var node = data.specifications[id]
              node['rdfs:subClassOf'] = [node.parent_id]
              if (node.label) node['rdfs:label'] = node.label
              if (node.definition) node['IAO:0000115'] = node.definition
              if (node.deprecated) node['owl:deprecated'] = node.deprecated

              if (node.other_parents) node['rdfs:subClassOf'].push(...node.other_parents)
            })

            data.term = data.specifications;
            delete(data.specifications)

          }
          else {
            var store = $rdf.graph();
            // Give it a full URL so OWL has proper file address
            if (URL.indexOf('http') != 0)
              URL = RE_URL.exec(document.location) + URL;

            try {
              // Given url is used simply to identify ontology source.
              // Good tips here: https://github.com/solid/solid-tutorial-rdflib.js/issues/4
              $rdf.parse(this.responseText, store, URL, 'application/rdf+xml');
              data = process_ontology(store);
              var store = $rdf.graph();      
            } 

            catch (err) {
                console.log(err)
                alert("OWL couldn't parse" + err.message)
                data = null;
            }
          }
        }
        catch(err) {
          alert("Error:" + err.message);
          data = null;
        }

        top.RAW_DATA = data;
        callback()
      }
      else {
        alert("There was a problem loading this URL! (If it redirects somewhere, that isn't allowed): " + URL)
      }
    }
  }
  xhttp.open("GET", URL, true);
  xhttp.send(null);
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
  console.log(move.components["gamepad-controls"]);
  // const dialogEntity = document.createElement('a-entity');
  // dialogEntity.setAttribute('dialog-popup','')
  // dialogEntity.setAttribute('position', '0 0 -5')
  // camera.appendChild(dialogEntity)
  const controllers = document.querySelectorAll("a-entity[laser-controls]");
  controllers.forEach(controller => {
  //   console.log(controller);
    controller.setAttribute('haptics','');
    controller.setAttribute('remove-hud','');
    controller.setAttribute('search-popup','');
  });
  // const leftHand = document.createElement('a-entity');
  // const rightHand = document.createElement('a-entity');
  // controllers[0].setAttribute('laser-controls','model', 'true');
  // controllers[0].setAttribute('id','leftHand');
  // // leftHand.setAttribute('raycaster', {lineColor: 'blue'});
  // controllers[1].setAttribute('laser-controls','model', 'true');
  // controllers[1].setAttribute('id','rightHand');

  // rightHand.setAttribute('raycaster', {lineColor: 'blue',
  // objects: '[forcegraph]'});
  // rig.appendChild(rightHand);
  // rig.appendChild(leftHand);
  // console.log(rightHand);
  // console.log(leftHand.getAttribute('raycaster'));

  // lc.removeAttribute('daydream-controls');
  // lc.removeAttribute('gearvr-controls');
  // lc.removeAttribute('hp-mixed-reality-controls') ;
  // lc.removeAttribute('magicleap-controls');
  // lc.removeAttribute('oculus-go-controls') ;
  // lc.removeAttribute('oculus-touch-controls');
  // lc.removeAttribute('valve-index-controls');
  // lc.removeAttribute('vive-controls');
  // lc.removeAttribute('vive-focus-controls');
  // lc.removeAttribute('windows-motion-controls');
  // lc.removeAttribute('generic-tracked-controller-controls');
  // lc.removeAttribute('laser-controls');
  // const nodeHUD = document.createElement("a-entity");
  // nodeHUD.setAttribute("geometry", {
  //   primitive: 'plane',
  //    height: 5,
  //     width: 5,
  // });
  // nodeHUD.setAttribute("material", {
  //   color: 'gray',
  //   opacity: 0.5
  // });
  // nodeHUD.setAttribute("position", '0 0 -5');
  // lc.appendChild(nodeHUD);
  // lc.setAttribute("dropdown-controller",'');
  // console.log(controllers[0].getAttribute('laser-controls'));
  // console.log(controllers[1].getAttribute('laser-controls'));

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
              sphereEl.setAttribute("color",child.__data.color)
            } else {
              sphereEl = document.createElement("a-sphere");
              sphereEl.classList.add("node");
              sphereEl.id = child.__data.id;
              this.spheres.set(child.__data.id, sphereEl);
              let radius = child.__data.radius;
              sphereEl.setAttribute("radius", radius - 0.1);
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
              labelBackground.setAttribute("position", { x: 0, y: 0, z: -1 });

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
              label.setAttribute("position", { x: 0, y: 0, z: 5 * radius });
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
 const rafter = document.querySelector("a-entity[raycaster]");

  // r.setAttribute('position', "0 -0.9 0");
  // r.setAttribute('rotation', "90 0 0");
  spheresEntity.setAttribute("position", "0 0 -2000");
  spheresEntity.setAttribute("rotation", "270 0 0");
  // const removerComp = document.createElement("a-entity");
  // removerComp.setAttribute("remove-hud", "");
  // rig.appendChild(removerComp);
}

function init_search(data) {
  /*
    Create a select list of all the node labels, in alphabetical order.
    Includes search of the node's synonyms via a customization of chosen.js
  */

  var label_search = $("#label_search")
  label_search.empty().append('<option value="">Term search ...</option>')

  if (data) {      
    // search 
    var sorted_data = data.nodes.concat().sort(function(a,b) {
      return (a.label === undefined || a.label.localeCompare(b.label))
    })

    for (var item in sorted_data) {
      var node = sorted_data[item]
      var option = $(`<option value="${node.id}">${node['rdfs:label']}</option>`);
 
      // Search by any of the terms related synonyms
      var synonyms = []
      SYNONYM_FIELD.forEach(function(synonym) {
        if (node[synonym])
          synonyms.push(node[synonym])
      });
      var synonym_str = synonyms.length ? ';' + synonyms.join(';') : '';

      // Allows searching by node id as well.
      option.attr('synonyms', node.id + synonym_str); 

      label_search.append(option);
    }
  }
  
  label_search.chosen({
    placeholder_text_single: 'Term search ...',
    no_results_text: "Oops, nothing found!",
    disable_search_threshold: 10,
    search_contains: true, //substring search
  })

  label_search.prop('disabled', data && data.nodes.length > 0 ? false : true)
  label_search.trigger("chosen:updated");
  
}


function init_ontofetch_data(rawData, cache=null) {
  /*
  This is a 2 pass algorithm.
  
  1st pass: Establish node depth and label, and color based on node prefix.
  2nd pass: Establish links and adjust according to parent node depth.

  INPUT
    rawData.term: Array of nodes

  */

  top.dataLookup = {};
  top.linkLookup = {};

  let data = {'nodes':[], 'links':[]};

  if (!rawData)
    return data;

  // 1st pass does all the nodes.
  for (var item in rawData.term) {
    let node = rawData.term[item];
    
    if (!node['owl:deprecated'] || RENDER_DEPRECATED) {
      try {
        if (cache != null) {
          let cached_node = cache.filter(obj => {
            return obj.id == item
          })[0];
          
          node.x = cached_node.x;
          node.y = cached_node.y;
          node.z = cached_node.z;
        }
      } catch {
        console.log("Warning: A node is undefined");
      }

      node.children = [];
      node.color =    null;
      node.depth =    0;
      node.group_id = null;
      node.prefix = get_term_prefix(node.id);
      set_node_label(node);
      data.nodes.push(node);
      top.dataLookup[node.id] = node;
      
      let ancestors = [node];
      let focus = node;
      while (focus.parent_id) {
        if (focus.id == focus.parent_id) {
          console.log('ERROR: ontology term has itself as parent:' + focus.id)
          focus.depth = 1;
          break;
        }
        if (!rawData.term[focus.parent_id]) {
          focus.depth = 1;
          break;
        }
        
        focus = rawData.term[focus.parent_id];
        
        if (focus.depth) { // already calculated depth.
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
      for (var ptr = 0; ptr < ancestors.length; ptr ++) {
        // Don't use ancestor = ancestors.pop(); seems to intefere with data.nodes ???
        let ancestor = ancestors[ancestors.length - ptr - 1];
        ancestor.depth = focus.depth + ptr + 1;
      }
    }
    
  }
  
  // To support the idea that graph can work on top-level nodes first
  data.nodes.sort(function(a,b) { return (a.depth - b.depth) })
  
  // If custom render depth chosen, chop nodes deeper than that. 
  if (RENDER_DEPTH != 50) {
    data.nodes = data.nodes.filter(n => (n.depth <= RENDER_DEPTH)) ; 
  }
  
  // Establish lookup table for all nodes
  data.nodes.forEach((n, idx) => {top.dataLookup[n.id] = n }); 
  
  // 2nd pass does LINKS organized by depth, i.e. allowing inheritance of properties:
  for (let item in data.nodes) {
    let node = data.nodes[item];
    // Size node according to proximity to depth 0.
    node.radius = Math.pow(2, 7-node.depth); // # of levels
    
    // Any node which has a layout record including custom color, gets group_id = itself.
    if (top.layout[node.id] && top.layout[node.id].color) {
      node.group_id = node.id;

      // Color by layout overrides all
      let layout_group = top.layout[node.id];
      if (layout_group.color) {
        node.color = top.colors[layout_group.color];
      }
    };

    // Otherwise node.group is inherited from parent 
    if (node.parent_id) {
      const parent = top.dataLookup[node.parent_id];
      if (parent) {
        if (!node.group_id  && parent.group_id) {
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
    data.links = data.links.filter(l => top.dataLookup[l.source] && top.dataLookup[l.target]); 
  }

  data.nodes = preposition_nodes(data.nodes);

  set_legend(data);

  return data
}

function getOntologyColor(node) {
  var prefix = get_term_prefix(node.id);
  if (prefix in prefix_color_mapping){
    let colorImlooking = colors[prefix_color_mapping[prefix].color];
    return colorImlooking;
  }

  console.log ('Missing color for ontology prefix ' + prefix + ' in ' + node.id);
  return 'red'
}

/*
  Redraw legends according to given data.nodes
  One legend prepared for count by ontology term prefix
  Other legend prepared for count by ULO group a term falls under 
*/
function set_legend(data) {

  var ontology = {};
  var ulo_branch = {};

  for (var ptr in data.nodes) {
    const node = data.nodes[ptr];
    const prefix = get_term_prefix(node.id);
    
    if (!node['owl:deprecated']) { 

      // Stores a count of each prefix
      if (prefix in ontology) 
        ontology[prefix].count += 1;
      else {
        ontology[prefix] = {
          count: 1, 
          label: prefix, 
          color: prefix_color_mapping[prefix] ? prefix_color_mapping[prefix].color : null
        };
      }
      // Figure out what to sort on

      // Store a count of ULO branch underlying nodes
      if (node.group_id in ulo_branch) 
        ulo_branch[node.group_id].count += 1;
      else {
        const group = top.dataLookup[node.group_id];
        if (group) {
          const layout_group = top.layout[group.group_id];
          ulo_branch[group.group_id] = {
            count: 1,
            label: group['rdfs:label'],
            prefix: get_term_prefix(group.id),
            color: top.colors[layout_group.color],
            ulo: true
          }
        }
      }
    }
  }
  set_legend_section('#ulo_legend', ulo_branch);
  set_legend_section('#ontology_legend', ontology);
}

// Render legend for coloring by ontology or ULO
function set_legend_section(dom_id, legend_dict) {

  $(dom_id).empty();

  for (var key of Object.keys(legend_dict).sort()) {
    item = legend_dict[key];
    // Don't show ULO category if only 1 item, or if there is a custom layout color for it
    if (!item.ulo || (item.count >1 || item.prefix && top.layout[key].color)) {
      $(dom_id).append(
        `<div class="legend_color" style="background-color:${item.color}">${item.count}</div>
        <div class="legend_item">${item.label}</div>
        <br/>`
      );
    }
  }

  if ($(dom_id).children('div').length)
      $(dom_id).prepend('<div class="legend_header">' + (dom_id == '#ulo_legend' ? 'ULO Branch Legend': 'Ontology Legend') + '<div/>');

}


function set_node_label(node) {
  /* Makes a clipped short_label for long labels.
  Also ensures id is shown if term has no rdfs:label
  */
  var label = node['rdfs:label'] // was node.label
  if (label) {
    // label derived from node's first few words ...
    node.short_label = label.replace(LABEL_RE, '$1*');
    if (node.short_label.indexOf('*') > 0) 
      node.short_label = node.short_label.split('*',1)[0] + ' ...'
  }
  else {
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
function set_link(links, source, target, radius, label='', color=null, other=false) {

  // Issue: after this is rendered, seems to switch source,target to objects?
  var link = { 
    source: source.id, 
    target: target.id, 
    label: label,
    highlight_color: color, // Hex or string
    width: radius,
    other: other
  };

  links.push(link);
  top.dataLookup[source.id].children.push(target.id);
  top.linkLookup[source.id + '-' + target.id] = link;

  return link;
}

function get_node_radius(node, fancyLayout) {
  /*
  Vary node radius by depth from root of structure.
  */
  if (node.highlight)
    return 20 
  if (node.radius > GRAPH_NODE_RADIUS)
    return node.radius
  return GRAPH_NODE_RADIUS
}

function preposition_nodes(nodes) {
  /* 
  Force graph begins dynamics normally by randomly placing nodes, but 
  this leads to challenging situations where nodes are not even remotely 
  where they should be - and their edge attraction can't get them back
  to local context.
  */
  for (var item in nodes) {
    var node = nodes[item]

    if (!RENDER_GALAXY)
      // Initially fix all nodes
      node.fz = node_depth(node)

    // Give initial x,y hint based on parents
    var layout_node = top.layout[node.id]
    if (layout_node) {
      node.fz = node_depth(node)
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
  return nodes
}

function node_depth(node) {
  /*
  Returns depth tier calculated as 1000 - depth of node from top of hierarchy in 
  GRAPH_NODE_DEPTH increments, but with first 6 levels having a power relation
  So 0:1024, 1:512, 2:256, 3:128, 4:64, 5: -100, 6: -200, 7: -300 etc.
  */
  base = node.depth < 11 ? 2 ** (10-node.depth) : 0  
  return base - (node.depth- 4) * GRAPH_NODE_DEPTH;
}


function render_node(node) {

  // Displays semi-sphere, then overlays with label text
  var group = new THREE.Group();
  var fancyLayout = layout[node.id] || !RENDER_QUICKER
  var nodeRadius = get_node_radius(node, fancyLayout);

  // if (fancyLayout) {
    // var geometry = new THREE.CircleGeometry(nodeRadius/4); // Doesn't provide 3d orientation
    // Set sphere to have fewer facets for rendering speed
    var geometry = new THREE.SphereGeometry(nodeRadius/2, 32, 16, 0); // (nodeRadius, 6, 4, 0, Math.PI) does 1/2 sphere
    var material = new THREE.MeshBasicMaterial( { color: node.color } );
    var circle = new THREE.Mesh( geometry, material );
    circle.position.set( 0, 0, 0 );
    group.add( circle );
    node.marker = circle;
    return circle;
  // }


  // HACK for background sized to text; using 2nd semitransparent grey sprite
  // as it always faces camera. However, latest 3d-force graph is causing
  // flicker for scale-reduced label and background sprite
  
  if (RENDER_LABELS) {

    // The text layer
    // factor function: 0->2; 1->1.75, 2-> 1.5, 3-> 1.25, 4-> 1.
    var depth_factor = node.depth > 4 ? 2 : 10 - node.depth*2;
    // // See https://github.com/vasturiano/three-spritetext for more options
    var sprite = new SpriteText(node.short_label);
    var z_offset = nodeRadius + depth_factor*4.5;

    sprite.color = top.SPRITE_FONT_COLOR;
    sprite.textHeight = 8 * depth_factor;
    // resolution of text, up to 90 (= slow)
    sprite.fontSize = 45; 

    sprite.position.set(0, fancyLayout ? 5 : 0, z_offset); //vertical offset.

    // Semi-transparent background layer for fancyLayout
    if (fancyLayout) {
      const sprite2 = new THREE.Sprite( SPRITE_MATERIAL );
      // z index proportional to node globe radius.; -5 to move it behind label
      sprite2.position.set( 0, 10, z_offset - 5 );
      var height = sprite._canvas.height * depth_factor/4.5;
      var width = sprite._canvas.width * depth_factor/2.25;
      sprite2.scale.set(width/2, height , 1);
      // group.add( sprite2 );
    }
    else {
      sprite.backgroundColor = 'gray';
      sprite.padding = 5;
    }
    sprite.scale
    // group.add( sprite );
  }
 
  const obj = new THREE.Object3D();
  obj.add(group);
  return obj;
}

function get_term_prefix(entity_id) {
  return entity_id ? entity_id.split(':')[0].split('#')[0] : null;
}

function lookup_url(term_id, label) {
  /* Returns HTML link of full "native" term URI, as well as OLS link.
  */

  if (!label)
    label = top.dataLookup[term_id].label

  var ols_lookup_URL = null
  // If no prefix, then whole term_id returned, and its probably a URI
  var prefix = get_term_prefix(term_id) 
  if (prefix == term_id) { 
    var term_url = term_id
  }
  else {
  // A prefix was recognized
    ols_lookup_URL = `https://www.ebi.ac.uk/ols/ontologies/${prefix}/terms?iri=`
    term_url = top.RAW_DATA['@context'][prefix]
    if (!term_url) {
      term_url = ONTOLOGY_LOOKUP_URL
    }
    term_url = term_url + term_id.split(/[:#]/)[1]

  }

  return  `<a href="${term_url}" target="_term">${label}</a>` + (ols_lookup_URL ? `, <a href="${ols_lookup_URL}${term_url}" target="_term">OLS</a> ` : '')
}


function get_term_id_urls(parent_list) {
  /* Gets HTML link list of all parents so one can click on them to navigate.
    
  */
  var parent_uris = []
  if (parent_list) {
    for (ptr in parent_list) {
      const parent_id = parent_list[ptr]
      var parent = top.dataLookup[parent_id]
      if (parent) {
        if (parent['rdfs:label'])
          parent_label = parent['rdfs:label']
        else
          parent_label = parent_id
        parent_uris.push(`<span class="focus" onclick="setNodeReport(top.dataLookup['${parent_id}'])">${parent_label}</span>`)
      }
      // alternate parents may not be in current node graph
      /* else {
        parent_uris.push('unrecognized: ' + parent_id)
      } */
    }
  }
  return parent_uris.length ? parent_uris.join(', ') : null
}

/*
  Render details about node in sidebar, and position camera to look at
  node from same vertical level.
  An empty node parameter causes sidebar information to be cleared out.
*/ 
function setNodeReport(node = {}) {

  parents = get_term_id_urls(node['rdfs:subClassOf'])

  // Label includes term id and links to 
  if (node['rdfs:label']) {
    label = node['rdfs:label'] + (node['owl:deprecated'] ? ' <span class="deprecated">deprecated</span>' : '') + '<span class="label_id"> (' + node.id + ' ' +lookup_url(node.id, 'OntoBee' ) + ') </span>'
  }
  else {
    label = null;
  }
  // <img src="img/link_out_20.png" border="0" width="16">
  $("#parents").html(parents || '<span class="placeholder">parent(s)</span>');
  $("#label").html(label || '<span class="placeholder">label</span>');
  // was node.definition
  $("#definition").html(node['IAO:0000115'] || '<span class="placeholder">definition</span>');

  $("#synonyms").html(node.synonyms || '<span class="placeholder">synonyms</span>');
  
  if (node.ui_label)
    $("#ui_label").show().html(node.ui_label);
  else
    $("#ui_label").hide();

  if (node.ui_definition)
    $("#ui_definition").show().html(node.ui_definition);
  else
    $("#ui_definition").hide();

  var select_child = $("#select_child")
  select_child.empty()
  select_child.css('visibility', node.children && node.children.length > 0 ? 'visible':'hidden')
  if (node.children && node.children.length > 0) {
    var option = document.createElement("option");
    select_child.append('<option value="">children ...</option>')

    for (var item in node.children) {
      const child = top.dataLookup[node.children[item]]
      if (child)
        select_child.append(`<option value="${child.id}">${child['rdfs:label']}</option>`)
    }
  }

  // Aim viewport camera at node from z dimension
  // Unfortunately camera animations cause it to loose its "UP" position.  
  // Solution?
  if (node.x) {

    // Color assigned here but rendered color isn't actually affected until 
    // AFTER next rebuild of graph/viewport.
    node.color = 'red'; 

    // This sets visual color directly in rendering engine so we don't have to
    // rerender graph as a whole!
    if (node.marker && node.marker.material) {
      node.marker.material.color.setHex(0xFF0000); 
      if (node.depth > 2) {
        node.marker.scale.x = 3
        node.marker.scale.y = 3
        //node.marker.scale.z = 3
      }
    }

    // top.GRAPH.cameraPosition(
    //   {x: node.x, y: node.y - 500, z: node.z+50}, // new position  + CAMERA_DISTANCE/2 
    //   node, // lookAt ({ x, y, z })  
    //   4000  // 4 second transition duration
    // )

  }
}

function nodeClickVR(node = {}) {
  //need to deselect other clicked nodes
  const fg = document.querySelector("[forcegraph]");
  if (node.x) {
    if (document.querySelector("#nodeHUD")) {
      document
        .querySelector("[forcegraph]")
        .components.forcegraph.data.nodes.forEach((node) => {
          const col = getOntologyColor(node);
          const numericColor = parseInt(col.substring(1), 16);
          node.marker.material.color.setHex(numericColor);
          node.color = col;
        });
    const HUDel = document.querySelector("#nodeHUD");
    HUDel.parentNode.removeChild(HUDel);
    }
    const controller = document.querySelector("a-entity[laser-controls]");
    controller.components.haptics.pulse(1, 200);
    const camera = document.querySelector("#camera");
    const nodeHUD = document.createElement("a-entity");
    const header = document.createElement("a-entity");
    const body = document.createElement("a-entity");
    const parents = document.createElement("a-entity");
    const children = document.createElement("a-entity");
    const mixin =document.createElement("a-mixin");

    nodeHUD.setAttribute("id", "nodeHUD");
    nodeHUD.setAttribute("class", "clickable");
    const value = node.id+"\n"+node.marker.__data["IAO:0000115"];
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
      value: node.id+"\n"+node["rdfs:label"],
      align: "center",
      baseline: 'top',
      width: 2.5,
    });
    header.setAttribute("position", "0 1 0")
    
    // header.setAttribute("position", "0 2 0");
    body.setAttribute("text", {
      value: node.marker.__data["IAO:0000115"],
      align: 'justify',
      width: 2.5
    });
    const parent_id = node.parent_id;
    const parent = top.dataLookup[parent_id]
    const parent_label = parent ? parent['rdfs:label'] : parent_id;
    parents.setAttribute("text", {
      value: 'Parent: '+parent_label,
      align: 'left',
      width: 2.5,
      anchor: 'left'
    });
    parents.setAttribute("position", "-1 -1 0");
    children.setAttribute("text", {
      value: node.parentNode,
      align: 'right',
      width: 2.5,
      anchor: 'left'
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

function nodeHoverVR(node = {}){
  // if(node){
  //   const dialog = document.querySelector('a-entity[dialog-popup]');
  // }
}
