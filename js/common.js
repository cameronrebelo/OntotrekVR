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
var auto_load = document.location.href.indexOf("?ontology=");
if (auto_load) {
  var choice = document.location.href.substr(auto_load + 10).toLowerCase();
  $("#ontology")
    .children(`option[value="data/${choice}.json"]`)
    .attr("selected", "selected");
  $("#ontology").trigger("change");
}

// Saves an object as a JSON
function save(blob, filename) {
  var link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Helper function to save nodes/links as JSON
function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

function init_interface() {
  // Selection list of all node labels allows user to zoom in on one
  $("#ontology").on("change", function (item) {
    if (this.value > "") {
      const cache_url = $("select#ontology option").filter(":selected")[0]
        .dataset.cache;

      var request = new XMLHttpRequest();
      request.open("GET", cache_url, false);
      request.send();
      if (request.status == 404) {
        load_data(this.value, do_graph);
      } else {
        load_data(this.value, load_graph);
      }
    }
  });

  $("#ontology").chosen({ placeholder_text_single: "Select an item ..." });

  // Allows user to re-render the ontology instead of loading up a snapshot
  $("#rerender_button").on("click", function (item) {
    do_graph();
  });

  // Allows the user to download JSONs for the nodes and links of the ontology
  $("#download_button").on("click", function (item) {
    const { nodes, links } = top.GRAPH.graphData();
    const nodes_out = nodes.map(({ id, x, y, z }) => ({ id, x, y, z }));

    for (i = 0; i < nodes_out.length; i++) {
      nodes_out[i].x = parseInt(nodes_out[i].x, 10);
      nodes_out[i].y = parseInt(nodes_out[i].y, 10);
      nodes_out[i].z = parseInt(nodes_out[i].z, 10);
    }

    const out_obj = {
      nodes: nodes_out,
      // 'meta': top.RAW_DATA
    };
    saveString(JSON.stringify(out_obj), "cache.json");
  });

  // Selection list of all node labels allows user to zoom in on one
  $("#label_search").on("change", function (item) {
    if (this.value != "") setNodeReport(top.dataLookup[this.value]);
  });

  $("#upload_cache").on("change", function (event) {
    var reader = new FileReader();

    reader.onload = function (event) {
      top.NODES_JSON = JSON.parse(event.target.result);
    };

    reader.readAsText(event.target.files[0]);
  });

  // Uploads JSON cache file
  $("#upload_json_button").on("click", function (item) {
    const cache_url = $("#upload_cache").val();
    const onto_url = $("#ontology_url").val();
    const url_ok = RE_URL.exec(onto_url);

    if (!url_ok) {
      alert(`The ontology URL: "${onto_url}" is not valid`);
    }

    if (cache_url > "" && url_ok) {
      try {
        load_uploaded_graph();
      } catch (err) {
        alert(
          "Something is wrong with either the URL or the cache file. Ensure that the URL is pointing directly to an owl rdf/xml file and that the cache file corresponds to the correct ontology. " +
            err.message
        );
        data = null;
      }
    }
  });

  //$("#ontology_url").on('change', function(item) {
  //  alert("Fetching: " + this.value)
  //  get_ontology(this.value)
  //})

  $("#ontology_url_button").on("click", function (item) {
    const url = $("#ontology_url").val();
    const url_ok = RE_URL.exec(url);
    if (url_ok)
      try {
        load_data(url, do_graph);
      } catch (err) {
        alert(
          "URL fetch didn't work. Note, URL must point directly to an owl rdf/xml file.  It can't be redirected to another location: " +
            err.message
        );
        data = null;
      }
    else alert(`The ontology URL: "${url}" is not valid`);
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_deprecated").on("change", function (item) {
    RENDER_DEPRECATED = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  });

  // upper level ontology edge coloring
  $("input[name='ulo_edge_coloring']").on("click", function (item) {
    RENDER_ULO_EDGE = this.value == "true";
    $("#ulo_legend").toggle(RENDER_ULO_EDGE);
    $("#ontology_legend").toggle(!RENDER_ULO_EDGE);

    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_slices").on("change", function (item) {
    RENDER_SLICES = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  });

  $("#thickness_control").on("change", function (item) {
    GRAPH_LINK_WIDTH = parseFloat(this.value);
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_quicker").on("change", function (item) {
    RENDER_QUICKER = this.checked;
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  $("#render_labels").on("change", function (item) {
    RENDER_LABELS = this.checked;
    top.GRAPH.refresh();
  });

  /* With new OWL format this functionality broke.
  $("#render_other_parents").on('change', function(item) {
    RENDER_OTHER_PARENTS = this.checked;
    do_graph();
    // FUTURE: Just toggle visibility via WEBGL
  })
  */

  $("#render_dimensions").on("change", function (item) {
    GRAPH_DIMENSIONS = parseInt(this.value);
    if (top.GRAPH) {
      // It appears iterative algorithm doesn't work with num dimensions
      // because it fixes x,y,z of parent nodes.  Must switch to alternate
      // rendering algorithm, or relax x,y,z for nodes below a certain depth.
      top.GRAPH.numDimensions(GRAPH_DIMENSIONS);
      do_graph();
    }
  });

  $("#render_layer_depth").on("change", function (item) {
    GRAPH_NODE_DEPTH = parseInt(this.value);
    do_graph();
  });

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
  $("#depth_control").on("change", function (item) {
    RENDER_DEPTH = parseInt(this.value);
    do_graph();
  });

  // Selection list of all node labels allows user to zoom in on one
  $("#select_child").on("change", function (item) {
    if (this.value != "") setNodeReport(top.dataLookup[this.value]);
  });

  // Trace works on ROBOT "explain" Markdown format report.
  // $("#trace_button").on("click", function (item) {
  //   var trace_content = $("#trace_content").val().trim();
  //   if (trace_content != "") {
  //     // DisjointWith node to focus on in analysis, if any.
  //     var focus = null;

  //     var content = trace_content.split("\n");
  //     // Set up these arrays to catch any new nodes or links not existing in current graph
  //     var new_nodes = [];
  //     var new_links = [];

  //     for (ptr in content) {
  //       var result = triple_parse(content[ptr]);

  //       if (result) {
  //         var subject_node = get_node_from_url(
  //           new_nodes,
  //           result.subject_uri,
  //           result.subject_label
  //         );
  //         var object_node = get_node_from_url(
  //           new_nodes,
  //           result.object_uri,
  //           result.object_label
  //         );

  //         if (subject_node && object_node)
  //           switch (result.relation) {
  //             case "DisjointWith":
  //               // Find shared parent class/node of both those nodes
  //               // - that is where disjointness is defined?
  //               //alert(source_id + " disjoint with " + target_id)

  //               link = get_link(
  //                 new_links,
  //                 subject_node,
  //                 object_node,
  //                 20,
  //                 result.relation,
  //                 0xff0000
  //               ); // RED
  //               // Set Focus here
  //               link.highlight = 0xff0000;
  //               focus = subject_node;
  //               break;

  //             case "SubClassOf":
  //               link = get_link(
  //                 new_links,
  //                 object_node,
  //                 subject_node,
  //                 10,
  //                 result.relation,
  //                 0xffa500
  //               ); // Orange
  //               link.highlight = 0xffa500;
  //               break;
  //           }
  //       }
  //     }

  //     // There are new node or links to add
  //     if (new_nodes.length || new_links.length) {
  //       const { nodes, links } = top.GRAPH.graphData();
  //       nodes.push(...new_nodes);
  //       links.push(...new_links);
  //       top.GRAPH.graphData({ nodes: nodes, links: links });
  //     }

  //     top.GRAPH.refresh(); // Trigger update of 3d objects in scene

  //     if (focus) setNodeReport();
  //   }
  // });
  // searchBar = document.createElement("a-entity");
  // searchBar.setAttribute("")
  // searchBar.setAttribute("id", "searchBar");
  // searchBar.setAttribute("htmlembed", "");
  // searchBar.setAttribute("position", "0 1 -2");
  // searchBar.setAttribute("scale", "3 3 3");
  // const label = document.querySelector('#label_search');
  var select = document.createElement("select");

  // Create an array of selectable values
  var values = [1, 2, 3, 4, 5];

  // // Populate the select element with options
  values.forEach(function (value) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  document
    .querySelector("#fix")
    .appendChild(document.querySelector("#label_search"));
  //         camera.appendChild(searchBar);
}

/************************** CONTRADICTION REPORTING ***************************/

// function triple_parse(line) {
//   /* This is for the superimposition of unsatisfiability explanations provided
//   by OWLAPI. Ontotrek provides a short instruction about how to get these via
//   the command line https://robot.obolibrary.org/ tool. These explanations come
//   in the form of a list of [subject] [relation] [object] triples which have 
//   at least one triple that is causing unsatisfiability.
  
//   Here we use a regular expression to find markdown expressions of 
//   [subject relation object] tripe and return a dictionary of each element.
  
//   INPUT: a text line hopefully of Markdown format representation of a triple
//   generated by the "robot" program (https://robot.obolibrary.org/). Example 
//   line:

//     "- [geopolitical region](http://semanticscience.org/resource/SIO_000415) SubClassOf [designated area on Earth](http://purl.obolibrary.org/obo/GENEPIO_0001886)"

//   OUTPUT: A dictionary key values in pattern of:

//     { object_label: "immaterial entity"
//       object_uri: "http://purl.obolibrary.org/obo/BFO_0000141"
//       relation: "DisjointWith"
//       subject_label: "material entity"
//       subject_uri: "http://purl.obolibrary.org/obo/BFO_0000040"
//     }
  
//   */

//   var matchObj = RE_MD_TRIPLE.exec(line);
//   if (matchObj) return matchObj.groups;

//   //console.log("line", line, "regex", matchObj)
//   return null;
// }

// function get_node_from_url(new_nodes, url, label) {
//   /*  RE_NAMESPACE_URL on ontology term URL returns dictionary {
//     prefix: "http://purl.obolibrary.org/obo/BFO_",
//     namespace: "BFO",
//     id: 123456}
//   */
//   const re_node = RE_NAMESPACE_URL.exec(url);
//   if (re_node) {
//     groups = re_node.groups;
//     node_id = groups.namespace + ":" + groups.id;
//     var node = top.dataLookup[node_id];
//     if (!node) {
//       node = make_node(new_nodes, node_id, label);
//     }
//     node.highlight = true;
//     return node;
//   }

//   console.log("Problem parsing:", url);
//   return node;
// }

// function make_node(new_nodes, node_id, label) {
//   // Used in Markdown to triple conversion
//   // FUTURE: Code z-axis based on depth call.
//   node = {
//     id: node_id,
//     "rdfs:label": label,
//     "rdfs:subClassOf": [],
//     parent_id: null,
//     group_id: null,
//     "IAO:0000115": "",
//     color: "#FFF", // Default color by ontology
//     depth: 4, // Initializes a bigger but not giant label
//     children: [],
//   };
//   new_nodes.push(node);
//   top.dataLookup[node.id] = node;
//   return node;
// }

// function get_link(new_links, source, target, radius, label, highlight_color) {
//   /* Highlights link between source_id node and target_id node.
//   Makes a link if one doesn't exist and adds to new_links.
//   */

//   var link = top.linkLookup[`${source.id}-${target.id}`];
//   if (!link) {
//     link = set_link(new_links, source, target, radius, label, highlight_color);
//   }
//   return link;
//   /* This is direct access code to link that has already been entered into
//   graph. Issue with direct access is THREE is reusing material definitions as 
//   objects on creation. Can't set color of individual materials.  Seems to
//   be a different story for nodes which are individually created materials.
//   if (link.__lineObj) {
//     link.__lineObj.material.color.setHex(hex_color)
//     link.__lineObj.scale.x = 2
//     link.__lineObj.scale.y = 2
//     link.__lineObj.scale.z = 2
//   }
//   */
// }

function highlite_node(query) {
  let nodesArray = this.BUILT_DATA.nodes;
  document.querySelector("[forcegraph]").components.forcegraph.data.nodes;
  for (let node = 0; node < nodesArray.length; node++) {
    if (nodesArray[node]["rdfs:label"] === query) {
      // console.log(node);
      nodesArray[node].marker.material.color.setHex(0xff0000);

      return;
    }
  }
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
  var json_file_type = URL.toLowerCase().indexOf("json") > 0;
  if (json_file_type) xhttp.overrideMimeType("application/json");
  else xhttp.overrideMimeType("rdf/xml");

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          if (json_file_type) {
            // CONVERSION JSON data to work with new OWL format
            var data = JSON.parse(this.responseText);

            Object.keys(data.specifications).forEach(function (id) {
              var node = data.specifications[id];
              node["rdfs:subClassOf"] = [node.parent_id];
              if (node.label) node["rdfs:label"] = node.label;
              if (node.definition) node["IAO:0000115"] = node.definition;
              if (node.deprecated) node["owl:deprecated"] = node.deprecated;

              if (node.other_parents)
                node["rdfs:subClassOf"].push(...node.other_parents);
            });

            data.term = data.specifications;
            delete data.specifications;
          } else {
            var store = $rdf.graph();
            // Give it a full URL so OWL has proper file address
            if (URL.indexOf("http") != 0)
              URL = RE_URL.exec(document.location) + URL;

            try {
              // Given url is used simply to identify ontology source.
              // Good tips here: https://github.com/solid/solid-tutorial-rdflib.js/issues/4
              $rdf.parse(this.responseText, store, URL, "application/rdf+xml");
              data = process_ontology(store);
              var store = $rdf.graph();
            } catch (err) {
              console.log(err);
              alert("OWL couldn't parse" + err.message);
              data = null;
            }
          }
        } catch (err) {
          alert("Error:" + err.message);
          data = null;
        }

        top.RAW_DATA = data;
        callback();
      } else {
        alert(
          "There was a problem loading this URL! (If it redirects somewhere, that isn't allowed): " +
            URL
        );
      }
    }
  };
  xhttp.open("GET", URL, true);
  xhttp.send(null);
}

function init_search(data) {
  /*
    Create a select list of all the node labels, in alphabetical order.
    Includes search of the node's synonyms via a customization of chosen.js
  */

  var label_search = $("#label_search");
  label_search.empty().append('<option value="">Term search ...</option>');

  if (data) {
    // search
    var sorted_data = data.nodes.concat().sort(function (a, b) {
      return a.label === undefined || a.label.localeCompare(b.label);
    });

    for (var item in sorted_data) {
      var node = sorted_data[item];
      var option = $(
        `<option value="${node.id}">${node["rdfs:label"]}</option>`
      );

      // Search by any of the terms related synonyms
      var synonyms = [];
      SYNONYM_FIELD.forEach(function (synonym) {
        if (node[synonym]) synonyms.push(node[synonym]);
      });
      var synonym_str = synonyms.length ? ";" + synonyms.join(";") : "";

      // Allows searching by node id as well.
      option.attr("synonyms", node.id + synonym_str);

      label_search.append(option);
    }
  }

  label_search.chosen({
    placeholder_text_single: "Term search ...",
    no_results_text: "Oops, nothing found!",
    disable_search_threshold: 10,
    search_contains: true, //substring search
  });

  label_search.prop("disabled", data && data.nodes.length > 0 ? false : true);
  label_search.trigger("chosen:updated");
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

    if (!node["owl:deprecated"]) {
      // Stores a count of each prefix
      if (prefix in ontology) ontology[prefix].count += 1;
      else {
        ontology[prefix] = {
          count: 1,
          label: prefix,
          color: prefix_color_mapping[prefix]
            ? prefix_color_mapping[prefix].color
            : null,
        };
      }
      // Figure out what to sort on

      // Store a count of ULO branch underlying nodes
      if (node.group_id in ulo_branch) ulo_branch[node.group_id].count += 1;
      else {
        const group = top.dataLookup[node.group_id];
        if (group) {
          const layout_group = top.layout[group.group_id];
          ulo_branch[group.group_id] = {
            count: 1,
            label: group["rdfs:label"],
            prefix: get_term_prefix(group.id),
            color: top.colors[layout_group.color],
            ulo: true,
          };
        }
      }
    }
  }
  set_legend_section("#ulo_legend", ulo_branch);
  set_legend_section("#ontology_legend", ontology);
}

// Render legend for coloring by ontology or ULO
function set_legend_section(dom_id, legend_dict) {
  $(dom_id).empty();

  for (var key of Object.keys(legend_dict).sort()) {
    item = legend_dict[key];
    // Don't show ULO category if only 1 item, or if there is a custom layout color for it
    if (!item.ulo || item.count > 1 || (item.prefix && top.layout[key].color)) {
      $(dom_id).append(
        `<div class="legend_color" style="background-color:${item.color}">${item.count}</div>
        <div class="legend_item">${item.label}</div>
        <br/>`
      );
    }
  }

  if ($(dom_id).children("div").length)
    $(dom_id).prepend(
      '<div class="legend_header">' +
        (dom_id == "#ulo_legend" ? "ULO Branch Legend" : "Ontology Legend") +
        "<div/>"
    );
}

/*
  Render details about node in sidebar, and position camera to look at
  node from same vertical level.
  An empty node parameter causes sidebar information to be cleared out.
*/
function setNodeReport(node = {}) {
  parents = get_term_id_urls(node["rdfs:subClassOf"]);

  // Label includes term id and links to
  if (node["rdfs:label"]) {
    label =
      node["rdfs:label"] +
      (node["owl:deprecated"]
        ? ' <span class="deprecated">deprecated</span>'
        : "") +
      '<span class="label_id"> (' +
      node.id +
      " " +
      lookup_url(node.id, "OntoBee") +
      ") </span>";
  } else {
    label = null;
  }
  // <img src="img/link_out_20.png" border="0" width="16">
  $("#parents").html(parents || '<span class="placeholder">parent(s)</span>');
  $("#label").html(label || '<span class="placeholder">label</span>');
  // was node.definition
  $("#definition").html(
    node["IAO:0000115"] || '<span class="placeholder">definition</span>'
  );

  $("#synonyms").html(
    node.synonyms || '<span class="placeholder">synonyms</span>'
  );

  if (node.ui_label) $("#ui_label").show().html(node.ui_label);
  else $("#ui_label").hide();

  if (node.ui_definition) $("#ui_definition").show().html(node.ui_definition);
  else $("#ui_definition").hide();

  var select_child = $("#select_child");
  select_child.empty();
  select_child.css(
    "visibility",
    node.children && node.children.length > 0 ? "visible" : "hidden"
  );
  if (node.children && node.children.length > 0) {
    var option = document.createElement("option");
    select_child.append('<option value="">children ...</option>');

    for (var item in node.children) {
      const child = top.dataLookup[node.children[item]];
      if (child)
        select_child.append(
          `<option value="${child.id}">${child["rdfs:label"]}</option>`
        );
    }
  }

  // Aim viewport camera at node from z dimension
  // Unfortunately camera animations cause it to loose its "UP" position.
  // Solution?
  if (node.x) {
    // Color assigned here but rendered color isn't actually affected until
    // AFTER next rebuild of graph/viewport.
    node.color = "red";

    // This sets visual color directly in rendering engine so we don't have to
    // rerender graph as a whole!
    if (node.marker && node.marker.material) {
      node.marker.material.color.setHex(0xff0000);
      if (node.depth > 2) {
        node.marker.scale.x = 3;
        node.marker.scale.y = 3;
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